import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GeminiWebsocketClient } from './websocket-client.service';
import { AudioRecorderService } from './audio-recorder.service';
import { AudioStreamerService } from './audio-streamer.service';
import { CameraManagerService } from './camera-manager.service';
import { ScreenManagerService } from './screen-manager.service';
import { ConfigService } from './config.service';
import { UtilsService } from './utils.service';
import { DeepgramTranscriberService } from './deepgram-transcriber.service';
import { AudioVisualizerService } from './audio-visualizer.service';

@Injectable({
  providedIn: 'root'
})
export class GeminiAgentService {
  private initialized = false;
  private connected = false;
  private client: GeminiWebsocketClient | null = null;
  private audioRecorder: AudioRecorderService | null = null;
  private audioStreamer: AudioStreamerService | null = null;
  private cameraManager: CameraManagerService | null = null;
  private screenManager: ScreenManagerService | null = null;
  private deepgramTranscriber: DeepgramTranscriberService | null = null;
  private agentDeepgramTranscriber: DeepgramTranscriberService | null = null;
  private visualizer: AudioVisualizerService | null = null;
  private audioContext: AudioContext | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private cameraInterval: any = null;
  private screenInterval: any = null;

  // --- Added for mic auto-ducking ---
  private isAgentSpeaking = false;
  private ttsSilenceTimer: any = null;
  // ----------------------------------

  constructor(
    private configService: ConfigService,
    private utilsService: UtilsService,
    private audioVisualizerService: AudioVisualizerService,
    private injectedCameraManager: CameraManagerService,         // <-- inject shared instance
    private injectedScreenManager: ScreenManagerService,         // <-- inject shared instance
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Wire injected singletons so the agent uses the same instances as the component
    this.cameraManager = this.injectedCameraManager;
    this.screenManager = this.injectedScreenManager;
  }

  private initializeServices(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Create services only when needed in browser context
    this.audioRecorder = new AudioRecorderService(this.utilsService);
    this.audioStreamer = new AudioStreamerService(this.configService);
    // Remove per-instance creations; we now use injected singletons:
    // this.cameraManager = new CameraManagerService(this.utilsService, this.platformId);
    // this.screenManager = new ScreenManagerService(this.platformId);
    
    // Initialize Deepgram transcriber if API key is available
    const deepgramApiKey = this.configService.getDeepgramApiKey();
    if (deepgramApiKey) {
      this.deepgramTranscriber = new DeepgramTranscriberService(this.configService, this.platformId);
      this.agentDeepgramTranscriber = new DeepgramTranscriberService(this.configService, this.platformId);
    }
  }

  async connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Connection is only available in the browser');
    }

    if (this.connected) {
      console.log('Already connected');
      return;
    }

    // Initialize services when connecting
    if (!this.audioRecorder) {
      console.log('Initializing services...');
      this.initializeServices();
    }

    try {
      console.log('=== CONNECTION DIAGNOSTICS ===');
      
      // Test API key first - but catch errors gracefully
      console.log('Testing API key...');
      try {
        const keyTest = await this.configService.testApiKey();
        if (!keyTest.valid) {
          console.warn('API Key validation failed:', keyTest.error);
          // Don't throw here - let WebSocket connection attempt to provide more info
        } else {
          console.log('✓ API key is valid');
        }
      } catch (keyError) {
        console.warn('API key test failed, proceeding with connection attempt:', keyError);
      }

      console.log('Getting configuration...');
      const config = this.configService.getConfig();
      const url = this.configService.getWebsocketUrl();
      
      console.log('WebSocket URL configured');
      
      console.info('Creating WebSocket client...');
      this.client = new GeminiWebsocketClient('GeminiAgent', url, config, this.utilsService, this.platformId);
      
      console.info('Connecting to WebSocket...');
      await this.client.connect();
      
      console.info('Setting up event listeners...');
      this.setupEventListeners();
      
      this.connected = true;
      console.info('✓ Successfully connected to Gemini API');
      
    } catch (error: any) {
      console.error('Failed to connect to Gemini API:', error);
      this.connected = false;
      
      // Clean up on connection failure
      this.client = null;
      
      // Provide more specific error messages based on error type
      if (error.message?.includes('API Key Error') || error.message?.includes('Invalid Gemini API key')) {
        throw new Error('Invalid or missing API key. Please check your Gemini API key in Settings (⚙️).');
      } else if (error.message?.includes('quota exceeded') || error.message?.includes('exhaustion')) {
        throw new Error('API quota exceeded. Please check your Gemini API usage limits or try again later.');
      } else if (error.message?.includes('rate limited')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Connection timeout. Please check your internet connection and try again.');
      } else if (error.message?.includes('WebSocket') || error.message?.includes('abnormally')) {
        throw new Error('Connection failed. This might be due to network issues or API quota exhaustion. Please check your API key and try again.');
      } else {
        throw new Error('Connection failed: ' + (error.message || 'Unknown error'));
      }
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    try {
      await this.stopCameraCapture();
      await this.stopScreenShare();
      if (this.audioRecorder) {
        this.audioRecorder.stop();
      }
      if (this.audioStreamer) {
        this.audioStreamer.stop();
      }
      if (this.audioVisualizerService) {
        this.audioVisualizerService.cleanup();
      }
      if (this.deepgramTranscriber) {
        this.deepgramTranscriber.disconnect();
      }
      if (this.agentDeepgramTranscriber) {
        this.agentDeepgramTranscriber.disconnect();
      }
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }
      if (this.client) {
        this.client.disconnect();
        this.client = null;
      }
      this.connected = false;
      this.initialized = false;
      this.cameraInterval = null;
      this.screenInterval = null;
      this.audioRecorder = null;
      this.audioStreamer = null;
      this.cameraManager = null;
      this.screenManager = null;
      this.deepgramTranscriber = null;
      this.agentDeepgramTranscriber = null;
      this.visualizer = null;
      this.eventListeners.clear();
    } catch (error) {
      this.connected = false;
      this.initialized = false;
      console.error('Disconnect error:', error);
    }
  }

  async initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Initialization is only available in the browser');
    }
    if (this.initialized) {
      console.log('Already initialized');
      return;
    }
    if (!this.connected) {
      throw new Error('Must be connected before initialization');
    }
    
    // Verify WebSocket connection is actually ready
    if (!this.client || !this.client.isConnected()) {
      throw new Error('WebSocket client is not properly connected');
    }
    
    try {
      console.log('Starting initialization...');
      this.audioContext = new AudioContext();
      
      if (this.audioStreamer) {
        await this.audioStreamer.initialize();
        try {
          const analyser = this.audioVisualizerService.initialize(this.audioContext, 'visualizer');
          if (this.audioStreamer.gainNode) {
            this.audioStreamer.gainNode.connect(analyser);
          }
          this.audioVisualizerService.start();
        } catch (error) {
          console.warn('Audio visualizer initialization failed:', error);
        }
      }
      
      if (this.deepgramTranscriber) {
        try {
          await this.initializeDeepgramTranscriber();
        } catch (error) {
          console.warn('Deepgram user transcriber initialization failed:', error);
        }
      }
      if (this.agentDeepgramTranscriber) {
        try {
          await this.initializeAgentDeepgramTranscriber();
        } catch (error) {
          console.warn('Deepgram agent transcriber initialization failed:', error);
        }
      }
      
      this.initialized = true;
      console.log('Initialization complete, ready to start interview');
      
      // Don't send initial message here - let the interview service handle it
      
    } catch (error) {
      this.initialized = false;
      console.error('Initialization error:', error);
      throw new Error('Failed to initialize: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async initializeDeepgramTranscriber(): Promise<void> {
    if (!this.deepgramTranscriber) return;

    console.info('Initializing Deepgram transcriber...');
    
    await this.deepgramTranscriber.connect();
    
    // Handle transcription events
    this.deepgramTranscriber.on('transcription', (transcript: string) => {
      console.info('Deepgram transcription:', transcript);
      this.emit('user_transcription', transcript);
    });

    this.deepgramTranscriber.on('error', (error: any) => {
      console.error('Deepgram transcription error:', error);
    });
  }

  private async initializeAgentDeepgramTranscriber(): Promise<void> {
    if (!this.agentDeepgramTranscriber) return;

    console.info('Initializing Deepgram agent transcriber...');
    await this.agentDeepgramTranscriber.connect();

    this.agentDeepgramTranscriber.on('transcription', (transcript: string) => {
      // Emit as model transcription to appear in chat while agent speaks
      console.info('Deepgram agent transcription:', transcript);
      this.emit('transcription', transcript);
    });

    this.agentDeepgramTranscriber.on('error', (error: any) => {
      console.error('Deepgram agent transcription error:', error);
    });
  }

  async sendText(text: string): Promise<void> {
    if (!this.client) throw new Error('Not connected');
    console.log('GeminiAgent sending text:', text);
    await this.client.sendText(text);
    // Don't emit 'text_sent' here to prevent duplicate messages
    // The component already adds the user message before calling this
  }

  async sendSystemMessage(text: string): Promise<void> {
    if (!this.client) throw new Error('Not connected');
    // Send the message but don't emit 'text_sent' so it doesn't appear in chat
    await this.client.sendText(text);
    console.log('System message sent (hidden from chat):', text.substring(0, 100) + '...');
  }

  async toggleMic(): Promise<void> {
    console.log('=== AGENT TOGGLE MIC ===');
    if (!this.audioRecorder) {
      console.error('Audio recorder not available');
      throw new Error('Audio recorder not available');
    }
    
    const wasRecording = this.audioRecorder.isRecording();
    console.log('Current recording state:', wasRecording);
    
    if (!wasRecording) {
      console.log('Starting recording via agent...');
      await this.startRecording();
    } else {
      console.log('Stopping recording via agent...');
      this.audioRecorder.stop();
    }
    
    console.log('Agent toggle complete. Now recording:', this.audioRecorder.isRecording());
  }

  isRecording(): boolean {
    const recording = this.audioRecorder?.isRecording() || false;
    console.log('Agent isRecording check:', recording);
    return recording;
  }

  // --- Helpers to pause/resume user mic while AI speaks ---
  private async pauseUserMicForTts(): Promise<void> {
    try {
      if (this.audioRecorder?.isRecording() && !this.audioRecorder.isMicSuspended()) {
        await this.audioRecorder.suspendMic();
        console.info('User mic suspended during TTS');
      }
    } catch (e) {
      console.warn('Failed to suspend mic during TTS:', e);
    }
  }

  private async resumeUserMicAfterTts(): Promise<void> {
    try {
      if (this.audioRecorder?.isRecording() && this.audioRecorder.isMicSuspended()) {
        await this.audioRecorder.resumeMic();
        console.info('User mic resumed after TTS');
      }
    } catch (e) {
      console.warn('Failed to resume mic after TTS:', e);
    }
  }

  private markAgentSpeaking(): void {
    this.isAgentSpeaking = true;
    // Pause mic immediately to avoid interrupting TTS
    this.pauseUserMicForTts();

    // Notify listeners that AI started speaking
    this.emit('agent_speaking', true);

    // Reset silence timer; resume mic if no new audio from AI for 600ms
    if (this.ttsSilenceTimer) clearTimeout(this.ttsSilenceTimer);
    this.ttsSilenceTimer = setTimeout(() => {
      this.isAgentSpeaking = false;
      this.resumeUserMicAfterTts();
      // Notify listeners that AI stopped speaking after silence
      this.emit('agent_speaking', false);
    }, 600);
  }

  private clearTtsStateAndResumeMic(): void {
    this.isAgentSpeaking = false;
    if (this.ttsSilenceTimer) {
      clearTimeout(this.ttsSilenceTimer);
      this.ttsSilenceTimer = null;
    }
    this.resumeUserMicAfterTts();
    // Notify listeners that AI stopped speaking
    this.emit('agent_speaking', false);
  }
  // --------------------------------------------------------

  private async startRecording(): Promise<void> {
    console.log('=== AGENT START RECORDING ===');
    if (!this.audioRecorder || !this.client) {
      console.error('Missing dependencies:', { audioRecorder: !!this.audioRecorder, client: !!this.client });
      return;
    }

    try {
      await this.audioRecorder.start((audioData: string) => {
        // Drop user audio frames while AI is speaking
        if (this.isAgentSpeaking) {
          // Avoid spamming logs; uncomment if needed
          // console.debug('Dropping user audio while AI is speaking');
          return;
        }

        console.log('Audio data received, length:', audioData.length);
        if (this.client) {
          this.client.sendAudio(audioData);
        }
        
        // Send audio to Deepgram for transcription
        if (this.deepgramTranscriber && this.deepgramTranscriber.connected) {
          try {
            const arrayBuffer = this.utilsService.base64ToArrayBuffer(audioData);
            this.deepgramTranscriber.sendAudio(arrayBuffer);
          } catch (error) {
            console.error('Error sending audio to Deepgram:', error);
          }
        }
      });
      console.log('Agent recording started successfully');
    } catch (error) {
      console.error('Failed to start agent recording:', error);
      throw error;
    }
  }

  async startCameraCapture(): Promise<void> {
    if (!this.connected || !this.cameraManager) {
      throw new Error('Must be connected to start camera capture');
    }

    try {
      await this.cameraManager.initialize();
      
      // Set up interval to capture and send images
      const fps = parseInt(localStorage.getItem('fps') || '5');
      const captureInterval = 1000 / fps;
      
      this.cameraInterval = setInterval(async () => {
        try {
          const imageBase64 = await this.cameraManager!.capture();
          if (this.client) {
            await this.client.sendImage(imageBase64);
          }
        } catch (error) {
          console.error('Error capturing camera image:', error);
        }
      }, captureInterval);
      
      console.info('Camera capture started');
    } catch (error) {
      console.error('Failed to start camera capture:', error);
      throw error;
    }
  }

  async stopCameraCapture(): Promise<void> {
    if (this.cameraInterval) {
      clearInterval(this.cameraInterval);
      this.cameraInterval = null;
    }
    
    if (this.cameraManager) {
      this.cameraManager.dispose();
    }
    
    console.info('Camera capture stopped');
  }

  async startScreenShare(): Promise<void> {
    if (!this.connected || !this.screenManager) {
      throw new Error('Must be connected to start screen sharing');
    }

    try {
      await this.screenManager.initialize();
      
      // Set up interval to capture and send screenshots
      const fps = parseInt(localStorage.getItem('fps') || '2');
      const captureInterval = 1000 / fps;
      
      this.screenInterval = setInterval(async () => {
        try {
          const imageBase64 = await this.screenManager!.capture();
          if (this.client) {
            await this.client.sendImage(imageBase64);
          }
        } catch (error) {
          console.error('Error capturing screen:', error);
        }
      }, captureInterval);
      
      console.info('Screen sharing started');
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      throw error;
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.screenInterval) {
      clearInterval(this.screenInterval);
      this.screenInterval = null;
    }
    
    if (this.screenManager) {
      this.screenManager.dispose();
    }
    
    console.info('Screen sharing stopped');
  }

  private setupEventListeners(): void {
    if (!this.client) return;
    this.client.on('audio', (data: ArrayBuffer) => {
      // Mark AI as speaking and pause mic (auto-duck)
      this.markAgentSpeaking();

      if (this.audioStreamer && this.audioStreamer.isInitialized) {
        const audioData = new Uint8Array(data);
        this.audioStreamer.streamAudio(audioData);
      }
      // Also send agent audio to Deepgram for live captions in chat
      if (this.agentDeepgramTranscriber && this.agentDeepgramTranscriber.connected) {
        try {
          this.agentDeepgramTranscriber.sendAudio(data);
        } catch (err) {
          console.debug('Failed to forward agent audio to Deepgram:', err);
        }
      }
    });

    this.client.on('interrupted', () => {
      if (this.audioStreamer) {
        this.audioStreamer.stop();
      }
      // If AI was interrupted by user speech, consider AI not speaking and keep mic available
      this.clearTtsStateAndResumeMic();
      this.emit('interrupted');
    });

    this.client.on('turn_complete', () => {
      // AI finished speaking; safely resume mic
      this.clearTtsStateAndResumeMic();
      this.emit('turn_complete');
    });

    this.client.on('content', (content: any) => {
      if (content.modelTurn?.parts) {
        const textParts = content.modelTurn.parts.filter((p: any) => p.text);
        if (textParts.length > 0) {
          const text = textParts.map((p: any) => p.text).join(' ');
          this.emit('transcription', text);
        }
      }
    });
    this.client.on('tool_call', async (toolCall: any) => {
      // Tool call handling can be implemented here
      console.info('Received tool call:', toolCall);
    });
  }

  // Event emitter functionality
  on(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
  }

  onTranscription(callback: (transcript: string) => void): void {
    this.on('transcription', callback);
  }

  onTextSent(callback: (text: string) => void): void {
    this.on('text_sent', callback);
  }

  onInterrupted(callback: () => void): void {
    this.on('interrupted', callback);
  }

  onTurnComplete(callback: () => void): void {
    this.on('turn_complete', callback);
  }

  onScreenShareStopped(callback: () => void): void {
    this.on('screenshare_stopped', callback);
  }

  // New: Subscribe to AI speaking state changes
  onAgentSpeaking(callback: (speaking: boolean) => void): void {
    this.on('agent_speaking', callback);
  }

  private emit(eventName: string, data?: any): void {
    if (!this.eventListeners.has(eventName)) return;
    
    for (const callback of this.eventListeners.get(eventName)!) {
      callback(data);
    }
  }

  // Add event listener for user transcription
  onUserTranscription(callback: (transcript: string) => void): void {
    this.on('user_transcription', callback);
  }

  // Add public methods to check connection and initialization status
  isConnected(): boolean {
    return this.connected && this.client?.isConnected() || false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // New: expose current speaking state
  isAgentSpeakingNow(): boolean {
    return this.isAgentSpeaking;
  }
}
