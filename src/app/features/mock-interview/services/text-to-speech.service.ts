import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface SpeechSynthesisErrorEvent extends Event {
  readonly error: string;
}

/**
 * Wrapper around Web Speech API to provide controlled TTS playback.
 */
@Injectable({
  providedIn: 'root',
})
export class TextToSpeechService {
  private isSpeaking: boolean = false;
  private isSupported: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  onStart: (() => void) | null = null;
  onEnd: (() => void) | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.isSupported =
        typeof window !== 'undefined' && 'speechSynthesis' in window;
    }
  }

  /** Speak the provided text; invokes onStart/onEnd callbacks. */
  speak(text: string) {
    if (!isPlatformBrowser(this.platformId) || !this.isSupported) {
      console.error('Text-to-speech is not supported in this environment.');
      this.onEnd?.();
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Text-to-speech is not supported in this browser.');
      this.onEnd?.();
      return;
    }

    // Cancel any ongoing speech first
    this.cancel();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = 0.8; // Slightly slower for better clarity
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = 0.8; // Reduce volume to minimize feedback

    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      this.onStart?.();
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.onEnd?.();
    };

    this.currentUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      console.error(`SpeechSynthesis Error: ${event.error}`, event);
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.onEnd?.();
    };

    // Add a small delay to ensure proper audio context
    setTimeout(() => {
      if (this.currentUtterance) {
        window.speechSynthesis.speak(this.currentUtterance);
      }
    }, 100);
  }

  /** Stop any ongoing speech and reset state. */
  cancel() {
    if (
      isPlatformBrowser(this.platformId) &&
      this.isSupported &&
      typeof window !== 'undefined' &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  /** Public cleanup method to cancel playback. */
  cleanup() {
    this.cancel();
  }

  get supported(): boolean {
    return this.isSupported;
  }

  get speaking(): boolean {
    return this.isSpeaking;
  }
}
