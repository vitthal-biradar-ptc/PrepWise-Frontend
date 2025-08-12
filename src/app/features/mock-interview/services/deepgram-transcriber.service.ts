import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class DeepgramTranscriberService {
  private apiKey: string;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private eventListeners = new Map<string, Function[]>();
  private sampleRate: number;
  private autoReconnect = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private lastUrl: string | null = null;

  constructor(
    private configService: ConfigService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.apiKey = this.configService.getDeepgramApiKey();
    this.sampleRate = this.configService.getModelSampleRate();
    console.info('DeepgramTranscriber initialized');
  }

  async connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Deepgram connection is only available in the browser');
    }

    try {
      const url = `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=${this.sampleRate}`;
      this.lastUrl = url;
      console.info('Attempting to connect to Deepgram WebSocket...');
      
      // Create WebSocket with authorization in protocol
      this.ws = new WebSocket(url, ['token', this.apiKey]);
      this.ws.binaryType = 'arraybuffer';

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject('WebSocket not initialized');
          return;
        }

        this.ws.onopen = () => {
          this.isConnected = true;
          console.info('WebSocket connection established');
          this.clearReconnect();
          this.reconnectAttempts = 0;
          
          const config = {
            type: 'Configure',
            features: {
              model: 'nova-2',
              language: 'en-US',
              encoding: 'linear16',
              sample_rate: this.sampleRate,
              channels: 1,
              interim_results: false,
              punctuate: true,
              endpointing: 800
            },
          };
          
          console.debug('Sending configuration:', config);
          this.ws!.send(JSON.stringify(config));
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            if (response.type === 'Results') {
              const transcript = response.channel?.alternatives[0]?.transcript;

              if (transcript) {
                this.emit('transcription', transcript);
              }
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
            this.emit('error', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          // Don't reject here if auto-reconnecting; close will handle retry
          if (!this.autoReconnect) {
            reject(error);
          }
        };

        this.ws.onclose = () => {
          console.info('WebSocket connection closed');
          this.isConnected = false;
          this.emit('disconnected');
          // Attempt reconnection with backoff
          if (this.autoReconnect) {
            this.scheduleReconnect();
          }
        };
      });
    } catch (error) {
      console.error('Error in connect():', error);
      throw error;
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket is not connected');
    }
    this.ws.send(audioData);
  }

  disconnect(): void {
    this.autoReconnect = false;
    if (this.ws) {
      try { this.ws.send(JSON.stringify({ type: 'CloseStream' })); } catch {}
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
    this.clearReconnect();
  }

  on(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
  }

  private emit(eventName: string, data?: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max Deepgram reconnect attempts reached');
      return;
    }
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
    this.reconnectAttempts += 1;
    console.info(`Scheduling Deepgram reconnect in ${Math.round(delay/1000)}s (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      if (!this.autoReconnect || this.isConnected) return;
      this.connect().catch(err => {
        console.warn('Deepgram reconnect failed:', err);
      });
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
