import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly MODEL_SAMPLE_RATE = 27000;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private getStorageItem(key: string, defaultValue: string = ''): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key) || defaultValue;
    }
    return defaultValue;
  }

  getWebsocketUrl(): string {
    // Prefer environment variable, fallback to localStorage so it can be set in Settings
    const envKey = environment.geminiApiKey;
    const lsKey = isPlatformBrowser(this.platformId) ? (localStorage.getItem('apiKey') || '') : '';
    const apiKey = (envKey && envKey !== 'YOUR_GEMINI_API_KEY_HERE') ? envKey : lsKey;

    console.log('API Key check:', {
      hasEnvKey: !!(envKey && envKey !== 'YOUR_GEMINI_API_KEY_HERE'),
      hasLsKey: !!lsKey,
      finalKeyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 10) || 'none'
    });

    if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.error('No valid Gemini API key found in environment variables or localStorage.');
      throw new Error('Gemini API key is required. Please set it in Settings (⚙️ button) or check your environment variables.');
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      console.error('Invalid Gemini API key format:', { 
        startsWithAIza: apiKey.startsWith('AIza'),
        length: apiKey.length 
      });
      throw new Error('Invalid Gemini API key format. Please check your API key in Settings.');
    }

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    console.debug('WebSocket URL configured successfully');
    return url;
  }

  // Add method to test API key validity
  async testApiKey(apiKey?: string): Promise<{ valid: boolean; error?: string }> {
    const testKey = apiKey || this.getApiKey();
    
    if (!testKey) {
      return { valid: false, error: 'No API key provided' };
    }

    try {
      // Test with a simple HTTP request to Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
      
      if (response.ok) {
        return { valid: true };
      } else if (response.status === 403) {
        return { valid: false, error: 'API key is invalid or access denied' };
      } else if (response.status === 429) {
        return { valid: false, error: 'API quota exceeded or rate limited' };
      } else {
        return { valid: false, error: `API error: ${response.status} ${response.statusText}` };
      }
    } catch (error) {
      return { valid: false, error: `Network error: ${error}` };
    }
  }

  private getApiKey(): string {
    const envKey = environment.geminiApiKey;
    const lsKey = isPlatformBrowser(this.platformId) ? (localStorage.getItem('apiKey') || '') : '';
    return (envKey && envKey !== 'YOUR_GEMINI_API_KEY_HERE') ? envKey : lsKey;
  }

  getDeepgramApiKey(): string {
    // Prefer environment variable, fallback to localStorage so it can be set in Settings
    const envKey = environment.deepgramApiKey;
    const lsKey = isPlatformBrowser(this.platformId) ? (localStorage.getItem('deepgramApiKey') || '') : '';
    return envKey || lsKey;
  }

  getModelSampleRate(): number {
    const stored = this.getStorageItem('sampleRate');
    return stored ? parseInt(stored) : this.MODEL_SAMPLE_RATE;
  }

  getConfig(): any {
    const thresholds: { [key: string]: string } = {
      '0': "BLOCK_NONE",
      '1': "BLOCK_ONLY_HIGH", 
      '2': "BLOCK_MEDIUM_AND_ABOVE",
      '3': "BLOCK_LOW_AND_ABOVE"
    };

    const config = {
      model: 'models/gemini-2.0-flash-exp',
      generationConfig: {
        temperature: parseFloat(this.getStorageItem('temperature', '1.8')),
        top_p: parseFloat(this.getStorageItem('top_p', '0.95')),
        top_k: parseInt(this.getStorageItem('top_k', '65')),
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { 
            prebuiltVoiceConfig: { 
              voiceName: this.getStorageItem('voiceName', 'Aoede')
            }
          }
        }
      },
      systemInstruction: {
        parts: [{
          text: this.getStorageItem('systemInstructions', 'You are a professional interviewer conducting a mock interview. Ask relevant questions, provide constructive feedback, and help the candidate improve their interview skills. Be encouraging, professional, and provide specific suggestions for improvement. Start the conversation by asking the candidate to introduce themselves.')
        }]
      },
      tools: {
        functionDeclarations: [],
      },
      safetySettings: [
        {
          "category": "HARM_CATEGORY_HARASSMENT",
          "threshold": thresholds[this.getStorageItem('harassmentThreshold', '1')] || "BLOCK_ONLY_HIGH"
        },
        {
          "category": "HARM_CATEGORY_DANGEROUS_CONTENT", 
          "threshold": thresholds[this.getStorageItem('dangerousContentThreshold', '1')] || "BLOCK_ONLY_HIGH"
        },
        {
          "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          "threshold": thresholds[this.getStorageItem('sexuallyExplicitThreshold', '1')] || "BLOCK_ONLY_HIGH"
        },
        {
          "category": "HARM_CATEGORY_HATE_SPEECH",
          "threshold": thresholds[this.getStorageItem('hateSpeechThreshold', '1')] || "BLOCK_ONLY_HIGH"
        },
        {
          "category": "HARM_CATEGORY_CIVIC_INTEGRITY",
          "threshold": thresholds[this.getStorageItem('civicIntegrityThreshold', '1')] || "BLOCK_ONLY_HIGH"
        }
      ]
    };

    console.debug('Configuration loaded:', config);
    return config;
  }
}