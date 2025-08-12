import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AudioStreamerService {
  private context: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private _sampleRate: number;
  private bufferSize: number;
  private processingBuffer = new Float32Array(0);
  private scheduledTime = 0;
  public gainNode: GainNode | null = null;  // Make public for external access
  private isStreamComplete = false;
  private checkInterval: any = null;
  private initialBufferTime = 0.05;
  public isInitialized = false;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;
  private scheduledSources = new Set<AudioBufferSourceNode>();

  constructor(private configService: ConfigService) {
    this._sampleRate = this.configService.getModelSampleRate();
    this.bufferSize = Math.floor(this._sampleRate * 0.32);
    console.info('AudioStreamer initialized', { sampleRate: this._sampleRate });
  }

  get sampleRate(): number {
    return this._sampleRate;
  }

  set sampleRate(value: number) {
    if (!Number.isFinite(value) || value <= 1 || value > 48000) {
      console.warn('Attempt to set invalid sample rate: ' + value + '. Must be between 1 and 48000Hz. Using saved sample rate instead: ' + this._sampleRate);
      return;
    }
    this._sampleRate = value;
    this.bufferSize = Math.floor(value * 0.32);
    console.info('Sample rate updated', { newRate: value, newBufferSize: this.bufferSize });
  }

  streamAudio(chunk: Int16Array | Uint8Array): void {
    if (!this.isInitialized) {
      console.warn('AudioStreamer not initialized. Call initialize() first.');
      return;
    }

    if (!chunk || !(chunk instanceof Int16Array || chunk instanceof Uint8Array)) {
      console.warn('Invalid audio chunk provided', { chunkType: chunk ? Object.prototype.toString.call(chunk) : 'null' });
      return;
    }

    try {
      // Convert Int16 samples to Float32 format
      const float32Array = new Float32Array(chunk.length / 2);
      
      // Create a new ArrayBuffer to ensure compatibility
      const arrayBuffer = chunk.buffer instanceof ArrayBuffer ? chunk.buffer : chunk.buffer.slice(0);
      const dataView = new DataView(arrayBuffer);

      for (let i = 0; i < chunk.length / 2; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768;  // Scale to [-1.0, 1.0] range
      }

      if (this.processingBuffer.length > this.bufferSize * 4) {
        console.warn('Processing buffer overflow, resetting', { 
          bufferSize: this.processingBuffer.length,
          maxSize: this.bufferSize * 4 
        });
        this.processingBuffer = new Float32Array(0);
      }

      const newBuffer = new Float32Array(this.processingBuffer.length + float32Array.length);
      newBuffer.set(this.processingBuffer);
      newBuffer.set(float32Array, this.processingBuffer.length);
      this.processingBuffer = newBuffer;

      while (this.processingBuffer.length >= this.bufferSize) {
        const buffer = this.processingBuffer.slice(0, this.bufferSize);
        this.audioQueue.push(buffer);
        this.processingBuffer = this.processingBuffer.slice(this.bufferSize);
      }

      if (!this.isPlaying && this.context) {
        this.isPlaying = true;
        this.scheduledTime = this.context.currentTime + this.initialBufferTime;
        this.scheduleNextBuffer();
      }
    } catch (error) {
      throw new Error('Error processing audio chunk: ' + error);
    }
  }

  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    if (!this.context) throw new Error('Audio context not initialized');
    
    const audioBuffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  private scheduleNextBuffer(): void {
    if (!this.isPlaying || !this.context) return;

    const SCHEDULE_AHEAD_TIME = 0.2;

    try {
      while (this.audioQueue.length > 0 && this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME) {
        const audioData = this.audioQueue.shift()!;
        const audioBuffer = this.createAudioBuffer(audioData);
        const source = this.context.createBufferSource();

        this.scheduledSources.add(source);
        source.onended = () => {
          this.scheduledSources.delete(source);
        };

        if (this.audioQueue.length === 0) {
          if (this.endOfQueueAudioSource) {
            this.endOfQueueAudioSource.onended = null;
          }
          this.endOfQueueAudioSource = source;
          source.onended = () => {
            this.scheduledSources.delete(source);
            if (!this.audioQueue.length && this.endOfQueueAudioSource === source) {
              this.endOfQueueAudioSource = null;
            }
          };
        }

        source.buffer = audioBuffer;
        if (this.gainNode) {
          source.connect(this.gainNode);
        }

        const startTime = Math.max(this.scheduledTime, this.context.currentTime);
        source.start(startTime);
        this.scheduledTime = startTime + audioBuffer.duration;
      }

      if (this.audioQueue.length === 0 && this.processingBuffer.length === 0) {
        if (this.isStreamComplete) {
          this.isPlaying = false;
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
          }
        } else if (!this.checkInterval) {
          this.checkInterval = setInterval(() => {
            if (this.audioQueue.length > 0 || this.processingBuffer.length >= this.bufferSize) {
              this.scheduleNextBuffer();
            }
          }, 100);
        }
      } else {
        const nextCheckTime = (this.scheduledTime - this.context.currentTime) * 1000;
        setTimeout(() => this.scheduleNextBuffer(), Math.max(0, nextCheckTime - 50));
      }
    } catch (error) {
      throw new Error('Error scheduling next buffer: ' + error);
    }
  }

  async initialize(): Promise<void> {
    try {
      if (this.context) {
        // Clean up previous context if re-initializing
        this.stop();
        this.context.close();
      }
      this.context = new AudioContext();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.isPlaying = false;
      this.isStreamComplete = false;
      this.audioQueue = [];
      this.processingBuffer = new Float32Array(0);
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
      this.isInitialized = true;
      this.endOfQueueAudioSource = null;
      this.scheduledSources.clear();
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      console.info('AudioStreamer initialization complete');
    } catch (error) {
      this.isInitialized = false;
      console.error('Failed to initialize AudioStreamer: ' + error);
      throw new Error('Failed to initialize AudioStreamer: ' + error);
    }
  }

  stop(): void {
    try {
      console.info('Stopping audio playback');
      this.isPlaying = false;
      this.isStreamComplete = true;
      for (const source of this.scheduledSources) {
        try {
          source.stop();
          source.disconnect();
        } catch (error) {
          console.debug('Error stopping audio source', { error: error });
        }
      }
      this.scheduledSources.clear();
      this.audioQueue = [];
      this.processingBuffer = new Float32Array(0);
      if (this.context) {
        this.scheduledTime = this.context.currentTime;
      }
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      try {
        if (this.gainNode && this.context) {
          this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
        }
      } catch (error) {
        console.error('Error during fade-out: ' + error);
      }
    } catch (error) {
      console.error('Error in AudioStreamer stop():', error);
    }
  }
}
