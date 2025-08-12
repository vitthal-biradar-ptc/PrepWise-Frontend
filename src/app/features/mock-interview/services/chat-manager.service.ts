import { Injectable } from '@angular/core';

export interface ChatMessage {
  id: string;
  type: 'user' | 'model';
  text: string;
  timestamp: Date;
  streaming?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatManagerService {
  private messages: ChatMessage[] = [];
  private currentStreamingMessage: ChatMessage | null = null;
  public lastUserMessageType: 'text' | 'audio' | null = null;
  private currentTranscript: string = '';

  constructor() {
    this.messages = [];
    this.currentStreamingMessage = null;
    this.lastUserMessageType = null;
    this.currentTranscript = '';
    console.log('ChatManagerService initialized');
  }

  getMessages(): ChatMessage[] {
    // Always return a new array for Angular change detection
    return [...this.messages];
  }

  addUserMessage(text: string): void {
    const message: ChatMessage = {
      id: this.generateId(),
      type: 'user',
      text: text,
      timestamp: new Date()
    };
    this.messages.push(message);
    this.lastUserMessageType = 'text';
  }

  addUserAudioMessage(): void {
    const message: ChatMessage = {
      id: this.generateId(),
      type: 'user',
      text: 'User sent audio',
      timestamp: new Date()
    };
    this.messages.push(message);
    this.lastUserMessageType = 'audio';
  }

  startModelMessage(): void {
    if (this.currentStreamingMessage) {
      this.finalizeStreamingMessage();
    }

    if (!this.lastUserMessageType) {
      this.addUserAudioMessage();
    }

    const message: ChatMessage = {
      id: this.generateId(),
      type: 'model',
      text: '',
      timestamp: new Date(),
      streaming: true
    };
    
    this.messages.push(message);
    this.currentStreamingMessage = message;
    this.currentTranscript = '';
  }

  updateStreamingMessage(text: string): void {
    if (!this.currentStreamingMessage) {
      this.startModelMessage();
    }
    
    if (this.currentStreamingMessage) {
      this.currentTranscript += ' ' + text;
      this.currentStreamingMessage.text = this.currentTranscript.trim();
    }
  }

  finalizeStreamingMessage(): void {
    if (this.currentStreamingMessage) {
      this.currentStreamingMessage.streaming = false;
      this.currentStreamingMessage = null;
      this.lastUserMessageType = null;
      this.currentTranscript = '';
    }
  }

  clear(): void {
    this.messages = [];
    this.currentStreamingMessage = null;
    this.lastUserMessageType = null;
    this.currentTranscript = '';
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}
