import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class CameraManagerService {
  private config = {
    width: 640,
    quality: 0.8,
    facingMode: 'user'
  };
  
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isInitialized = false;
  private aspectRatio: number | null = null;
  private previewContainer: HTMLElement | null = null;
  private switchButton: HTMLButtonElement | null = null;

  constructor(
    private utilsService: UtilsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize config from localStorage
      this.config.width = parseInt(localStorage.getItem('resizeWidth') || '640');
      this.config.quality = parseFloat(localStorage.getItem('quality') || '0.8');
      this.config.facingMode = localStorage.getItem('facingMode') || 'user';
    }
  }

  private setStorageItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  private getStorageItem(key: string, defaultValue: string): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key) || defaultValue;
    }
    return defaultValue;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } as MediaTrackConstraints
      };
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        (constraints.video as MediaTrackConstraints).facingMode = this.config.facingMode;
      }
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.playsInline = true;
      const previewContainer = document.getElementById('cameraPreview');
      if (previewContainer) {
        previewContainer.innerHTML = '';
        previewContainer.appendChild(this.videoElement);
        this.previewContainer = previewContainer;
        this.createSwitchButton();
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
      this.isInitialized = true;
      console.info('Camera initialized successfully');
    } catch (error) {
      this.isInitialized = false;
      this.dispose();
      console.error('Failed to initialize camera:', error);
      throw new Error(`Failed to initialize camera: ${error}`);
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

  private createSwitchButton(): void {
    if (!/Mobi|Android/i.test(navigator.userAgent)) return;
    if (this.switchButton) {
      this.switchButton.remove();
      this.switchButton = null;
    }
    this.switchButton = document.createElement('button');
    this.switchButton.className = 'camera-switch-btn';
    this.switchButton.innerHTML = '⟲';
    this.switchButton.addEventListener('click', () => this.switchCamera());
    this.previewContainer?.appendChild(this.switchButton);
  }

  private async switchCamera(): Promise<void> {
    if (!this.isInitialized) return;
    
    // Toggle facingMode
    this.config.facingMode = this.config.facingMode === 'user' ? 'environment' : 'user';
    this.setStorageItem('facingMode', this.config.facingMode);
    
    // Stop current stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    // Reinitialize with new facingMode
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: this.config.facingMode
        } as MediaTrackConstraints
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await this.videoElement.play();
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
      // Revert to previous facing mode on error
      this.config.facingMode = this.getStorageItem('facingMode', 'environment');
    }
  }

  getDimensions(): { width: number; height: number } {
    if (!this.isInitialized || !this.canvas) {
      throw new Error('Camera not initialized. Call initialize() first.');
    }
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  async capture(): Promise<string> {
    if (!this.isInitialized || !this.canvas || !this.ctx || !this.videoElement) {
      throw new Error('Camera not initialized. Call initialize() first.');
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
    if (this.switchButton) {
      this.switchButton.remove();
      this.switchButton = null;
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
}
   