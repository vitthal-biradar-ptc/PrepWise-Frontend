import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ScreenManagerService {
  private config = {
    width: 1280,
    quality: 0.8,
    onStop: null as (() => void) | null
  };
  
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isInitialized = false;
  private aspectRatio: number | null = null;
  private previewContainer: HTMLElement | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize config from localStorage
      this.config.width = parseInt(localStorage.getItem('resizeWidth') || '1280');
      this.config.quality = parseFloat(localStorage.getItem('quality') || '0.8');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        } as any,
        audio: false
      });
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.playsInline = true;
      const previewContainer = document.getElementById('screenPreview');
      if (previewContainer) {
        previewContainer.innerHTML = '';
        previewContainer.appendChild(this.videoElement);
        this.previewContainer = previewContainer;
        this.showPreview();
      }
      await this.videoElement.play();
      const videoWidth = this.videoElement.videoWidth;
      const videoHeight = this.videoElement.videoHeight;
      this.aspectRatio = videoHeight / videoWidth;
      const canvasWidth = this.config.width;
      const canvasHeight = Math.round(this.config.width * this.aspectRatio);
      this.canvas = document.createElement('canvas');
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      this.ctx = this.canvas.getContext('2d');
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.dispose();
        if (this.config.onStop) {
          this.config.onStop();
        }
      });
      this.isInitialized = true;
      console.info('Screen sharing initialized successfully');
    } catch (error) {
      this.isInitialized = false;
      this.dispose();
      console.error('Failed to initialize screen sharing:', error);
      throw new Error(`Failed to initialize screen capture: ${error}`);
    }
  }

  private showPreview(): void {
    if (this.previewContainer) {
      this.previewContainer.style.display = 'block';
    }
  }

  private hidePreview(): void {
    if (this.previewContainer) {
      this.previewContainer.style.display = 'none';
    }
  }

  getDimensions(): { width: number; height: number } {
    if (!this.isInitialized || !this.canvas) {
      throw new Error('Screen capture not initialized. Call initialize() first.');
    }
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  async capture(): Promise<string> {
    if (!this.isInitialized || !this.canvas || !this.ctx || !this.videoElement) {
      throw new Error('Screen capture not initialized. Call initialize() first.');
    }

    // Draw current video frame to canvas, maintaining aspect ratio
    this.ctx.drawImage(
      this.videoElement,
      0, 0,
      this.canvas.width,
      this.canvas.height
    );

    // Convert to base64 JPEG with specified quality
    return this.canvas.toDataURL('image/jpeg', this.config.quality).split(',')[1];
  }

  dispose(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    if (this.previewContainer) {
      this.hidePreview();
      this.previewContainer.innerHTML = '';
      this.previewContainer = null;
    }
    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false;
    this.aspectRatio = null;
  }

  setOnStopCallback(callback: () => void): void {
    this.config.onStop = callback;
  }
}
