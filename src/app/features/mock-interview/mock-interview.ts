import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ConnectionStatus, InterviewSetup } from '../../models/interview.models';
import { InterviewSetupComponent } from './interview-setup.component';
import { AudioRecorderService } from './services/audio-recorder.service';
import { CameraManagerService } from './services/camera-manager.service';
import { ChatManagerService } from './services/chat-manager.service';
import { ConfigService } from './services/config.service';
import { GeminiAgentService } from './services/gemini-agent.service';
import { InterviewService } from './services/interview.service';
import { ScreenManagerService } from './services/screen-manager.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, InterviewSetupComponent],
  templateUrl: './mock-interview.html',
  styleUrls: ['./mock-interview.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MockInterviewComponent implements OnInit, OnDestroy {
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chatHistory') chatHistory!: ElementRef<HTMLDivElement>;

  connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  isMicActive = false;
  isCameraActive = false;
  isScreenShareActive = false;
  errorMessage: string | null = null;
  connectionError: string | null = null;
  isInterviewActive = false;
  showSetup = true;
  currentSetup: InterviewSetup | null = null;

  // Expose ConnectionStatus enum to template
  ConnectionStatus = ConnectionStatus;

  // Accessibility captions for AI speech
  captionsEnabled = true;
  currentCaption = '';

  // Track AI speaking state
  private aiSpeaking = false;
  private wasMicActiveBeforeTts = false;

  constructor(
    private geminiAgent: GeminiAgentService,
    private chatManager: ChatManagerService,
    private settingsService: SettingsService,
    private interviewService: InterviewService,
    private ngZone: NgZone,
    private cameraManager: CameraManagerService,
    private screenManager: ScreenManagerService,
    private localAudioRecorder: AudioRecorderService,
    private router: Router,
    private configService: ConfigService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Only initialize in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.setupEventListeners();
    console.log('MockInterviewComponent initialized');
    console.log('Connection status:', this.connectionStatus);
    
    // Check if we're resuming or retaking an interview
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('resume') || urlParams.get('retake') || urlParams.get('restart')) {
        this.showSetup = false;
        // Prepare media before starting flow
        this.prepareMediaBeforeInterview()
          .then(() => this.startInterviewFlow())
          .catch(err => {
            console.error('Media preparation failed:', err);
            this.showError('Please grant camera, microphone, and screen permissions to continue.');
          });
        return;
      }
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private setupEventListeners(): void {
    // Listen for model responses (transcriptions of model speech)
    this.geminiAgent.onTranscription((transcript: string) => {
      this.ngZone.run(() => {
        // Don't create a new message on every chunk; ChatManager will start one if needed
        this.chatManager.updateStreamingMessage(transcript);
        // Update live captions
        if (this.captionsEnabled && transcript?.trim()) {
          this.currentCaption = ((this.currentCaption + ' ' + transcript).trim());
        }
        this.scrollToBottom();
      });
    });

    // Finalize model message on turn complete
    this.geminiAgent.onTurnComplete(() => {
      this.ngZone.run(() => {
        this.chatManager.finalizeStreamingMessage();
        this.currentCaption = '';
        this.scrollToBottom();
      });
    });

    // Reflect user text messages
    this.geminiAgent.onTextSent((text: string) => {
      this.ngZone.run(() => {
        this.chatManager.finalizeStreamingMessage();
        this.chatManager.addUserMessage(text);
        this.scrollToBottom();
      });
    });

    // Append Deepgram user transcription to chat
    this.geminiAgent.onUserTranscription((transcript: string) => {
      this.ngZone.run(() => {
        if (transcript?.trim()) {
          this.chatManager.addUserMessage(transcript.trim());
          // Record the answer for the interview service
          this.interviewService.recordAnswer(transcript.trim());
          this.scrollToBottom();
        }
      });
    });

    this.geminiAgent.onInterrupted(() => {
      this.ngZone.run(() => {
        this.chatManager.finalizeStreamingMessage();
        this.scrollToBottom();
      });
    });

    this.geminiAgent.onScreenShareStopped(() => {
      this.ngZone.run(() => this.isScreenShareActive = false);
    });

    // Track AI speaking state
    this.geminiAgent.onAgentSpeaking((speaking: boolean) => {
      this.ngZone.run(() => {
        this.aiSpeaking = speaking;
        if (speaking) {
          // Remember prior mic state and reflect as OFF in UI
          if (this.isMicActive) {
            this.wasMicActiveBeforeTts = true;
            this.isMicActive = false;
          }
        } else {
          // Restore mic active flag if it was active before TTS
          if (this.wasMicActiveBeforeTts) {
            this.isMicActive = true;
            this.wasMicActiveBeforeTts = false;
          }
        }
      });
    });
  }

  onSetupComplete(setup: InterviewSetup): void {
    this.currentSetup = setup;
    this.showSetup = false;
    // Prepare media before connecting/starting interview
    this.prepareMediaBeforeInterview()
      .then(() => this.startInterviewFlow())
      .catch(err => {
        console.error('Media preparation failed:', err);
        this.showError('Please grant camera, microphone, and screen permissions to continue.');
      });
  }

  private async startInterviewFlow(): Promise<void> {
    try {
      await this.connect();
      if (this.connectionStatus === ConnectionStatus.CONNECTED) {
        // Ensure agent media is active once connected
        await this.ensureAgentMediaActive();
        await this.startInterview();
      }
    } catch (error) {
      console.error('Failed to start interview flow:', error);
      this.showError('Failed to start interview. Please try again.');
    }
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === ConnectionStatus.CONNECTED) return;

    try {
      this.connectionStatus = ConnectionStatus.CONNECTING;
      this.connectionError = null;
      this.errorMessage = null;
      
      console.log('=== STARTING CONNECTION DIAGNOSTICS ===');
      console.log('1. Checking browser environment...');
      console.log('2. Checking API key...');
      
      await this.geminiAgent.connect();
      console.log('✓ Agent connected successfully');
      
      this.connectionStatus = ConnectionStatus.CONNECTED;
      console.info('✓ Successfully connected to Gemini API');

      // Initialize after connection
      await this.geminiAgent.initialize();
      console.log('✓ Agent initialized successfully');
      
    } catch (error: any) {
      console.error('=== CONNECTION FAILED ===');
      console.error('Error details:', error);
      
      this.connectionStatus = ConnectionStatus.ERROR;
      this.connectionError = error.message || 'Failed to connect to service';
      
      // Show specific error messages to help user
      if (error.message?.includes('API Key Error') || error.message?.includes('quota')) {
        this.errorMessage = 'API Key Issue: ' + error.message + '\n\nPlease:\n1. Check your API key in Settings (⚙️)\n2. Verify your Gemini API quota in Google AI Studio\n3. Make sure billing is enabled if required';
      } else if (error.message?.includes('timeout') || error.message?.includes('network')) {
        this.errorMessage = 'Connection Issue: ' + error.message + '\n\nPlease check your internet connection and try again.';
      } else {
        this.errorMessage = `Connection failed: ${error.message || 'Unknown error'}`;
      }
    }
  }

  // Fix the diagnostic method
  async testApiKey(): Promise<void> {
    try {
      console.log('Testing API key...');
      const result = await this.configService.testApiKey();
      
      if (result.valid) {
        this.showError('✓ API Key is valid and working!', 3000);
      } else {
        this.showError('✗ API Key Error: ' + result.error, 8000);
      }
    } catch (error) {
      this.showError('Failed to test API key: ' + error, 5000);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      // Also stop any local audio recorder if it was started pre-connection
      try { this.localAudioRecorder.stop(); } catch {}
      return;
    }

    try {
      // End interview if it's active
      if (this.isInterviewActive) {
        try {
          await this.endInterview();
        } catch (error) {
          console.warn('Failed to end interview during disconnect:', error);
        }
      }
      
      await this.geminiAgent.disconnect();
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.isMicActive = false;
      this.isCameraActive = false;
      this.isScreenShareActive = false;
      this.isInterviewActive = false;

      // Ensure local recorder is stopped as well
      try { this.localAudioRecorder.stop(); } catch {}
      
      // Clear chat when disconnecting
      this.chatManager.clear();
      
      // Show setup modal again
      this.showSetup = true;
      this.currentSetup = null;
      
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  async startInterview(): Promise<void> {
    if (!this.currentSetup) {
      this.showError('Interview setup is required');
      return;
    }

    try {
      await this.interviewService.startInterview(this.currentSetup);
      this.isInterviewActive = true;
      console.log('Interview started successfully');
    } catch (error) {
      console.error('Error starting interview:', error);
      this.showError('Failed to start interview. Please try again.');
    }
  }

  async endInterview(): Promise<void> {
    try {
      const result = await this.interviewService.endInterview();
      if (result) {
        // Save the result
        await this.interviewService.saveInterviewResult(result);
        
        // Redirect to results page
        this.router.navigate(['/interview-results']);
      }
    } catch (error) {
      console.error('Error ending interview:', error);
      this.showError('Failed to end interview properly.');
    }
  }

  async toggleMic(): Promise<void> {
    try {
      // Block mic toggling while AI is speaking
      if (this.geminiAgent.isAgentSpeakingNow()) {
        this.showError('Please wait until the AI finishes speaking.');
        return;
      }

      console.log('=== MIC TOGGLE START ===');
      console.log('Current state:', {
        connectionStatus: this.connectionStatus,
        isMicActive: this.isMicActive,
        agentRecording: this.geminiAgent.isRecording(),
        localRecording: this.localAudioRecorder.isRecording()
      });

      if (this.connectionStatus === ConnectionStatus.CONNECTED) {
        console.log('Connected mode - using agent');
        
        if (!this.isMicActive) {
          // Start recording
          console.log('Starting agent recording...');
          await this.geminiAgent.toggleMic();
          this.isMicActive = true;
        } else {
          // Stop recording
          console.log('Stopping agent recording...');
          await this.geminiAgent.toggleMic();
          this.isMicActive = false;
        }
        
        console.log('Agent mode result:', {
          isMicActive: this.isMicActive,
          agentRecording: this.geminiAgent.isRecording()
        });
        return;
      }

      // Disconnected mode - use local recorder
      console.log('Disconnected mode - using local recorder');
      
      if (!this.isMicActive) {
        console.log('Starting local recording...');
        await this.localAudioRecorder.start(() => {
          console.log('Local audio data received');
        });
        this.isMicActive = true;
      } else {
        console.log('Stopping local recording...');
        this.localAudioRecorder.stop();
        this.isMicActive = false;
      }
      
      console.log('Local mode result:', {
        isMicActive: this.isMicActive,
        localRecording: this.localAudioRecorder.isRecording()
      });
      
      console.log('=== MIC TOGGLE END ===');
      
    } catch (error) {
      console.error('=== MIC TOGGLE ERROR ===', error);
      this.isMicActive = false;
      this.showError(`Failed to toggle microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async toggleCamera(): Promise<void> {
    try {
      if (!this.isCameraActive) {
        if (this.connectionStatus === ConnectionStatus.CONNECTED) {
          await this.geminiAgent.startCameraCapture();
        } else {
          await this.cameraManager.initialize();
        }
        this.isCameraActive = true;
      } else {
        if (this.connectionStatus === ConnectionStatus.CONNECTED) {
          await this.geminiAgent.stopCameraCapture();
        }
        this.cameraManager.dispose();
        this.isCameraActive = false;
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
      this.showError('Failed to toggle camera. Please check your device settings.');
    }
  }

  async toggleScreenShare(): Promise<void> {
    try {
      if (!this.isScreenShareActive) {
        if (this.connectionStatus === ConnectionStatus.CONNECTED) {
          await this.geminiAgent.startScreenShare();
        } else {
          await this.screenManager.initialize();
        }
        this.isScreenShareActive = true;
      } else {
        if (this.connectionStatus === ConnectionStatus.CONNECTED) {
          await this.geminiAgent.stopScreenShare();
        }
        this.screenManager.dispose();
        this.isScreenShareActive = false;
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      this.showError('Failed to toggle screen share. Please check your permissions.');
    }
  }

  async sendMessage(): Promise<void> {
    console.log('=== SEND MESSAGE START ===');
    console.log('Connection status:', this.connectionStatus);
    
    const messageInput = this.messageInput?.nativeElement;
    if (!messageInput) {
      console.error('Message input element not found');
      return;
    }

    const text = messageInput.value.trim();
    console.log('Message text:', `"${text}"`);
    
    if (!text) {
      console.log('Empty message, focusing input');
      messageInput.focus();
      return;
    }

    try {
      console.log('Clearing input and adding to chat');
      
      // Clear input and add to chat immediately
      messageInput.value = '';
      this.chatManager.addUserMessage(text);
      this.scrollToBottom();
      
      // Check connection and send
      if (this.connectionStatus === ConnectionStatus.CONNECTED) {
        console.log('Sending to connected agent');
        await this.geminiAgent.sendText(text);
      } else {
        console.log('Not connected - message only added to chat');
        this.showError('Not connected to interview service. Please connect first.');
      }
      
      // Focus back to input
      setTimeout(() => {
        messageInput.focus();
      }, 100);
      
      // Record the answer for the interview service
      this.interviewService.recordAnswer(text);
      
      console.log('=== SEND MESSAGE SUCCESS ===');
    } catch (error) {
      console.error('=== SEND MESSAGE ERROR ===', error);
      this.showError('Failed to send message. Please try again.');
      // Restore the text if sending failed
      messageInput.value = text;
    }
  }

  onInputKeyPress(event: KeyboardEvent): void {
    console.log('Key pressed:', event.key, 'Input value:', (event.target as HTMLInputElement).value);
    if (event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
  }

  showSettings(): void {
    this.settingsService.show();
  }

  private showError(message: string, duration: number = 5000): void {
    this.errorMessage = message;
    console.error('Showing error:', message);
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = null;
      }
    }, duration);
  }

  // Prepare camera, microphone, and screen BEFORE starting the interview
  private async prepareMediaBeforeInterview(): Promise<void> {
    console.log('Preparing media before interview...');
    // Camera
    if (!this.isCameraActive) {
      await this.cameraManager.initialize();
      this.isCameraActive = true;
    }
    // Screen share (requires user gesture; this is called from Start Interview button)
    if (!this.isScreenShareActive) {
      await this.screenManager.initialize();
      this.isScreenShareActive = true;
    }
    // Mic - start local recorder to establish permission and keep active until agent takes over
    if (!this.isMicActive) {
      await this.localAudioRecorder.start(() => {
        // Discard locally captured audio; used only to keep mic active pre-connection
      });
      this.isMicActive = true;
    }
    console.log('Media prepared.');
  }

  // Ensure agent-side media capture is active once connected, and stop the local recorder
  private async ensureAgentMediaActive(): Promise<void> {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) return;

    console.log('Ensuring agent media is active...');
    // Start agent camera capture
    try { await this.geminiAgent.startCameraCapture(); } catch (e) { console.warn('Agent camera capture start failed:', e); }
    // Start agent screen share
    try { await this.geminiAgent.startScreenShare(); } catch (e) { console.warn('Agent screen share start failed:', e); }
    // Start agent mic if not already
    try {
      if (!this.geminiAgent.isRecording()) {
        await this.geminiAgent.toggleMic();
      }
    } catch (e) {
      console.warn('Agent mic start failed:', e);
    }
    // Stop local recorder to avoid duplicate audio streams
    try { this.localAudioRecorder.stop(); } catch {}
    console.log('Agent media ensured.');
  }

  get messages() {
    return this.chatManager.getMessages();
  }

  trackByMsg(index: number, msg: { id: string }): string {
    return msg?.id ?? String(index);
  }

  // Add method to ensure UI updates
  forceUpdate(): void {
    this.ngZone.run(() => {
      // Force change detection
    });
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    // Best-effort cleanup to avoid dangling media/devices
    try { this.geminiAgent.disconnect(); } catch {}
    try { this.localAudioRecorder.stop(); } catch {}
  }

  // Auto-scroll helper
  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        const el = this.chatHistory?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      } catch {}
    }, 0);
  }
}

