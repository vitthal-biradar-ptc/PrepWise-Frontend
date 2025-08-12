import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioVisualizerService {
  private audioContext: AudioContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private analyser: AnalyserNode | null = null;
  private bufferLength: number = 0;
  private dataArray: Uint8Array = new Uint8Array(0);
  private prevDataArray: Uint8Array = new Uint8Array(0);
  private gradientColors = ['#7F00FF', '#B03EFF', '#C400FF'];
  private lineWidth = 3;
  private padding = 20;
  private smoothingFactor = 0.6;
  private isAnimating = false;
  private animationId: number | null = null;
  private gradient: CanvasGradient | null = null;

  initialize(audioContext: AudioContext, canvasId: string): AnalyserNode {
    this.audioContext = audioContext;
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    
    if (!this.canvas) {
      throw new Error(`Canvas with id '${canvasId}' not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    
    // Set up audio analyser
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.bufferLength = this.analyser.frequencyBinCount;
    
    // Initialize arrays
    this.dataArray = new Uint8Array(this.bufferLength);
    this.prevDataArray = new Uint8Array(this.bufferLength);

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    this.createGradient();

    console.log('Audio visualizer initialized successfully', {
      canvasId,
      bufferLength: this.bufferLength,
      fftSize: this.analyser.fftSize
    });

    return this.analyser;
  }

  private createGradient(): void {
    if (!this.ctx || !this.canvas) return;

    this.gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    this.gradientColors.forEach((color, index) => {
      if (this.gradient) {
        this.gradient.addColorStop(index / (this.gradientColors.length - 1), color);
      }
    });
  }

  private resize(): void {
    if (!this.canvas) return;

    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.offsetWidth;
      this.canvas.height = container.offsetHeight;
      this.createGradient();
    }
  }

  private lerp(start: number, end: number, amt: number): number {
    return (1 - amt) * start + amt * end;
  }

  private draw = (): void => {
    if (!this.isAnimating || !this.ctx || !this.canvas) return;
    if (!this.analyser || !this.dataArray || !this.prevDataArray) return;

    try {
      // Store previous data and get new data
      this.prevDataArray.set(this.dataArray);
      this.analyser.getByteTimeDomainData(this.dataArray);

      // Clear the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Set up drawing style
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeStyle = this.gradient || '#B03EFF';
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      // Calculate dimensions
      const width = this.canvas.width - (this.padding * 2);
      const height = this.canvas.height - (this.padding * 2);
      const centerY = this.canvas.height / 2;

      // Draw the waveform
      const sliceWidth = width / (this.bufferLength - 1);
      let x = this.padding;

      // Start the path
      this.ctx.beginPath();
      this.ctx.moveTo(x, centerY);

      // Draw smooth curve
      for (let i = 0; i < this.bufferLength; i++) {
        // Interpolate between previous and current values
        const currentValue = this.dataArray[i] / 128.0;
        const prevValue = this.prevDataArray[i] / 128.0;
        const v = this.lerp(prevValue, currentValue, this.smoothingFactor);

        const y = (v * height / 2) + centerY;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          // Use quadratic curves for smoother lines
          const prevX = x - sliceWidth;
          const prevY = (this.lerp(this.prevDataArray[i-1]/128.0, this.dataArray[i-1]/128.0, this.smoothingFactor) * height / 2) + centerY;
          const cpX = (prevX + x) / 2;
          this.ctx.quadraticCurveTo(cpX, prevY, x, y);
        }

        x += sliceWidth;
      }

      // Add glow effect
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = this.gradientColors[1];

      // Stroke the path
      this.ctx.stroke();

      // Reset shadow for next frame
      this.ctx.shadowBlur = 0;
    } catch (error) {
      console.error('Error drawing audio visualization:', error);
    }

    // Request next frame
    this.animationId = requestAnimationFrame(this.draw);
  };

  start(): void {
    if (!this.isAnimating) {
      this.isAnimating = true;
      console.log('Starting audio visualization');
      this.draw();
    }
  }

  stop(): void {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Clear the canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    console.log('Audio visualization stopped');
  }

  cleanup(): void {
    this.stop();
    if (this.canvas) {
      window.removeEventListener('resize', this.resize.bind(this));
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (error) {
        console.warn('Error disconnecting audio analyser:', error);
      }
      this.analyser = null;
    }
    this.audioContext = null;
    this.canvas = null;
    this.ctx = null;
    this.dataArray = new Uint8Array(0);
    this.prevDataArray = new Uint8Array(0);
    this.gradient = null;
    console.log('Audio visualizer cleaned up');
  }
}
