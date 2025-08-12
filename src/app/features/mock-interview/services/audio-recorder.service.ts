import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService {
  private sampleRate = 16000;
  public stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;
  private fallbackProcessor: ScriptProcessorNode | null = null;
  private onAudioData: ((data: string) => void) | null = null;
  private isRecordingFlag = false;
  private isSuspendedFlag = false; // Renamed to avoid conflict

  constructor(private utilsService: UtilsService) {}

  async start(onAudioData: (data: string) => void): Promise<void> {
    console.log('=== AUDIO RECORDER START ===');
    if (this.isRecordingFlag) {
      console.warn('Recording already in progress');
      return;
    }

    this.onAudioData = onAudioData;
    try {
      console.log('Requesting microphone permission...');
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: this.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microphone permission granted, setting up audio context...');
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await this.audioContext.resume();
      }
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Always use ScriptProcessorNode for better compatibility
      console.log('Setting up ScriptProcessorNode...');
      const bufferSize = 2048;
      this.fallbackProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
      this.fallbackProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this.isRecordingFlag || !this.onAudioData) return;
        const input = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        this.onAudioData(this.utilsService.arrayBufferToBase64(int16.buffer));
      };
      this.source.connect(this.fallbackProcessor);
      this.fallbackProcessor.connect(this.audioContext.destination);

      this.isRecordingFlag = true;
      this.isSuspendedFlag = false;
      console.log('Audio recording started successfully');
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      this.isRecordingFlag = false;
      this.isSuspendedFlag = false;
      this.stop();
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied. Please allow microphone access and try again.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Microphone not supported on this device or browser.');
        }
      }
      throw error;
    }
  }

  stop(): void {
    console.log('=== AUDIO RECORDER STOP ===');
    try {
      if (this.stream) {
        console.log('Stopping media stream tracks...');
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }
      if (this.fallbackProcessor) {
        try { 
          this.fallbackProcessor.disconnect(); 
        } catch {}
        this.fallbackProcessor.onaudioprocess = null as any;
        this.fallbackProcessor = null;
      }
      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      this.isRecordingFlag = false;
      this.isSuspendedFlag = false;
      console.log('Audio recording stopped successfully');
    } catch (error) {
      this.isRecordingFlag = false;
      this.isSuspendedFlag = false;
      console.error('Failed to stop audio recording:', error);
    }
  }

  async suspendMic(): Promise<void> {
    if (!this.isRecordingFlag || this.isSuspendedFlag) return;
    
    try {
      if (this.audioContext) {
        await this.audioContext.suspend();
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.enabled = false);
      }
      this.isSuspendedFlag = true;
      console.info('Microphone suspended');
    } catch (error) {
      console.error('Failed to suspend microphone:', error);
    }
  }

  async resumeMic(): Promise<void> {
    if (!this.isRecordingFlag || !this.isSuspendedFlag) return;
    
    try {
      if (this.audioContext) {
        await this.audioContext.resume();
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.enabled = true);
      }
      this.isSuspendedFlag = false;
      console.info('Microphone resumed');
    } catch (error) {
      console.error('Failed to resume microphone:', error);
    }
  }

  async toggleMic(): Promise<void> {
    if (this.isSuspendedFlag) {
      await this.resumeMic();
    } else {
      await this.suspendMic();
    }
  }

  isRecording(): boolean {
    return this.isRecordingFlag;
  }

  isMicSuspended(): boolean {
    return this.isSuspendedFlag;
  }
}

