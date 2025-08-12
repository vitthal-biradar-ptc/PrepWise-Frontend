import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UtilsService } from './utils.service';

export interface WebSocketEventMap {
  'audio': ArrayBuffer;
  'interrupted': void;
  'turn_complete': void;
  'content': any;
  'tool_call': any;
  'tool_call_cancellation': any;
}

export class GeminiWebsocketClient {
  private name: string;
  private url: string;
  private ws: WebSocket | null = null;
  private config: any;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private platformId: Object;

  constructor(
    name: string = 'WebSocketClient',
    url: string,
    config: any,
    private utilsService: UtilsService,
    platformId: Object
  ) {
    this.name = name;
    this.url = url;
    this.config = config;
    this.platformId = platformId;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('WebSocket connections are only available in the browser');
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return this.connectionPromise!;
    }

    if (this.isConnecting) {
      console.log('Connection already in progress');
      return this.connectionPromise!;
    }

    console.info('🔗 Establishing WebSocket connection to:', this.url.substring(0, 100) + '...');
    this.isConnecting = true;
    
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log('Creating WebSocket instance...');
        const ws = new WebSocket(this.url);
        let connectionTimeout: any;
        let hasResolved = false;

        connectionTimeout = setTimeout(() => {
          if (!hasResolved) {
            console.error('WebSocket connection timeout after 30 seconds');
            hasResolved = true;
            ws.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout. This could indicate API quota exhaustion, invalid API key, or network issues.'));
          }
        }, 30000);

        ws.addEventListener('open', () => {
          if (hasResolved) return;
          
          console.info('✓ WebSocket connection established successfully');
          clearTimeout(connectionTimeout);
          this.ws = ws;
          this.isConnecting = false;

          // Wait a bit before sending setup to ensure connection is stable
          setTimeout(() => {
            try {
              if (hasResolved) return;
              
              console.log('Sending setup configuration...');
              this.sendJSON({ setup: this.config });
              console.debug("✓ Setup message sent successfully");
              
              hasResolved = true;
              resolve();
            } catch (error) {
              if (!hasResolved) {
                console.error('Failed to send setup configuration:', error);
                hasResolved = true;
                
                // Check if it's a specific API error
                if (error instanceof Error && error.message.includes('WebSocket is not connected')) {
                  reject(new Error('Connection lost immediately after opening. This usually indicates an invalid API key or quota exhaustion.'));
                } else {
                  reject(new Error('Failed to initialize connection: ' + error));
                }
              }
            }
          }, 100);
        });

        ws.addEventListener('error', (error) => {
          if (hasResolved) return;
          
          console.error('WebSocket error event:', error);
          clearTimeout(connectionTimeout);
          this.disconnect();
          this.isConnecting = false;
          hasResolved = true;
          
          // Check if this might be an API key/quota issue
          reject(new Error('WebSocket connection failed. This could be due to: 1) Invalid or expired API key, 2) Exhausted API quota, 3) Network connectivity issues. Please check your API key and quota in Google AI Studio.'));
        });

        ws.addEventListener('message', async (event) => {
          try {
            if (event.data instanceof Blob) {
              await this.receive(event.data);
            } else {
              // Handle text messages (often error messages)
              const data = JSON.parse(event.data);
              console.log('Received text message:', data);
              
              // Check for specific error messages from the API
              if (data.error) {
                console.error('API Error received:', data.error);
                if (data.error.message?.includes('quota')) {
                  console.error('Quota exceeded - API key may be exhausted');
                } else if (data.error.message?.includes('permission')) {
                  console.error('Permission denied - API key may be invalid');
                }
                
                // Don't close connection here, let the calling code handle it
                // Just log the error for debugging
              }
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        });

        ws.addEventListener('close', (event) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          
          let closeReason = 'Unknown reason';
          switch (event.code) {
            case 1000: closeReason = 'Normal closure'; break;
            case 1001: closeReason = 'Endpoint going away'; break;
            case 1002: closeReason = 'Protocol error'; break;
            case 1003: closeReason = 'Unsupported data type'; break;
            case 1006: closeReason = 'Abnormal closure (network/server issue)'; break;
            case 1011: closeReason = 'Server error'; break;
            case 1012: closeReason = 'Service restart'; break;
            case 1013: closeReason = 'Try again later'; break;
            case 1014: closeReason = 'Bad gateway'; break;
            case 1015: closeReason = 'TLS handshake failure'; break;
          }
          
          console.info('WebSocket connection closed', { 
            code: event.code, 
            reason: event.reason || closeReason,
            wasClean: event.wasClean 
          });

          if (!hasResolved && event.code !== 1000) {
            hasResolved = true;
            if (event.code === 1006) {
              reject(new Error('Connection failed abnormally. This often indicates API quota exhaustion or invalid API key.'));
            } else {
              reject(new Error(`Connection closed unexpectedly: ${closeReason} (Code: ${event.code})`));
            }
          }
        });

      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        this.isConnecting = false;
        reject(new Error('Failed to create WebSocket connection: ' + error));
      }
    });

    return this.connectionPromise;
  }

  private async receive(blob: Blob): Promise<void> {
    const response = await this.utilsService.blobToJSON(blob);
    
    if (response.toolCall) {
      console.debug(`${this.name} received tool call`, response);       
      this.emit('tool_call', response.toolCall);
      return;
    }

    if (response.toolCallCancellation) {
      console.debug(`${this.name} received tool call cancellation`, response);
      this.emit('tool_call_cancellation', response.toolCallCancellation);
      return;
    }

    if (response.serverContent) {
      const { serverContent } = response;
      if (serverContent.interrupted) {
        console.debug(`${this.name} is interrupted`);
        this.emit('interrupted');
        return;
      }
      if (serverContent.turnComplete) {
        console.debug(`${this.name} has completed its turn`);
        this.emit('turn_complete');
      }
      if (serverContent.modelTurn) {
        const parts = serverContent.modelTurn.parts;

        const audioParts = parts.filter((p: any) => p.inlineData && p.inlineData.mimeType.startsWith('audio/pcm'));
        const base64s = audioParts.map((p: any) => p.inlineData?.data);
        const otherParts = parts.filter((p: any) => !audioParts.includes(p));

        base64s.forEach((b64: string) => {
          if (b64) {
            const data = this.utilsService.base64ToArrayBuffer(b64);
            this.emit('audio', data);
          }
        });

        if (otherParts.length) {
          this.emit('content', { modelTurn: { parts: otherParts } });
          console.debug(`${this.name} sent:`, otherParts);
        }
      }
    } else {
      console.debug(`${this.name} received unmatched message:`, response);
    }
  }

  async sendAudio(base64audio: string): Promise<void> {
    const data = { 
      realtimeInput: { 
        mediaChunks: [{ 
          mimeType: 'audio/pcm', 
          data: base64audio 
        }] 
      } 
    };
    await this.sendJSON(data);
    console.debug(`Sending audio chunk to ${this.name}.`);
  }

  async sendText(text: string, endOfTurn = true): Promise<void> {
    const formattedText = { 
      clientContent: { 
        turns: [{
          role: 'user', 
          parts: { text: text }
        }], 
        turnComplete: endOfTurn 
      } 
    };
    await this.sendJSON(formattedText);
    console.debug(`Text sent to ${this.name}:`, text);
  }

  async sendImage(base64image: string): Promise<void> {
    const data = { 
      realtimeInput: { 
        mediaChunks: [{ 
          mimeType: 'image/jpeg', 
          data: base64image 
        }] 
      } 
    };
    await this.sendJSON(data);
    console.debug(`Image with a size of ${Math.round(base64image.length/1024)} KB was sent to the ${this.name}.`);
  }

  private async sendJSON(json: any): Promise<void> {        
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not connected. Current state: ' + (this.ws ? this.ws.readyState : 'null'));
      }
      
      console.log('Sending JSON data to WebSocket...');
      this.ws.send(JSON.stringify(json));
      console.log('JSON data sent successfully');
      
    } catch (error) {
      console.error('Failed to send JSON data:', error);
      throw new Error(`Failed to send data to ${this.name}: ${error}`);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnecting = false;
      this.connectionPromise = null;
      console.info(`${this.name} successfully disconnected from websocket`);
    }
  }

  on<K extends keyof WebSocketEventMap>(eventName: K, callback: (data: WebSocketEventMap[K]) => void): void;
  on(eventName: string, callback: Function): void;
  on(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
  }

  private emit(eventName: string, data?: any): void {
    if (!this.eventListeners.has(eventName)) return;
    
    for (const callback of this.eventListeners.get(eventName)!) {
      callback(data);
    }
  }
}