import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private dialog: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeElements();
    }
  }

  private getStorageItem(key: string, defaultValue: string = ''): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key) || defaultValue;
    }
    return defaultValue;
  }

  private setStorageItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  private initializeElements(): void {
    // Create settings dialog programmatically
    this.dialog = document.createElement('div');
    this.dialog.className = 'settings-dialog';
    this.dialog.innerHTML = this.getSettingsTemplate();

    this.overlay = document.createElement('div');
    this.overlay.className = 'settings-overlay';

    // Add styles dynamically
    this.addStyles();

    document.body.appendChild(this.dialog);
    document.body.appendChild(this.overlay);

    this.setupEventListeners();
    this.loadSettings();
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .settings-dialog {
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #1a1a1a;
        border: 1px solid #B03EFF;
        border-radius: 12px;
        padding: 20px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1001;
        color: white;
      }

      .settings-dialog.active {
        display: block;
      }

      .settings-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
      }

      .settings-overlay.active {
        display: block;
      }

      .settings-header {
        text-align: center;
        margin-bottom: 20px;
      }

      .settings-header h3 {
        color: #B03EFF;
        margin-bottom: 10px;
      }

      .settings-group {
        margin-bottom: 20px;
      }

      .settings-group label {
        display: block;
        margin-bottom: 8px;
        color: white;
        font-weight: bold;
      }

      .settings-group select,
      .settings-group input,
      .settings-group textarea {
        width: 100%;
        padding: 8px 12px;
        background-color: #2d2d2d;
        border: 1px solid #B03EFF;
        border-radius: 4px;
        color: white;
        font-size: 14px;
      }

      .settings-group textarea {
        resize: vertical;
        min-height: 80px;
      }

      .settings-group input[type="range"] {
        margin-bottom: 5px;
      }

      .range-value {
        color: #B03EFF;
        font-size: 12px;
        margin-top: 5px;
      }

      .collapsible {
        background-color: #2d2d2d;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 10px;
        cursor: pointer;
        border: 1px solid #B03EFF;
        user-select: none;
        transition: background-color 0.2s;
      }

      .collapsible:hover {
        background-color: #3d3d3d;
        border-color: #C400FF;
      }

      .collapsible-content {
        display: none;
        padding: 15px;
        border: 1px solid #B03EFF;
        border-top: none;
        border-radius: 0 0 4px 4px;
        margin-top: -10px;
        background-color: rgba(45, 45, 45, 0.5);
      }

      .collapsible-content.active {
        display: block;
      }

      .settings-save-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #7F00FF, #C400FF);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        margin-top: 20px;
        transition: all 0.2s;
      }

      .settings-save-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 15px rgba(176, 62, 255, 0.3);
        background: linear-gradient(135deg, #8A2BE2, #DA70D6);
      }

      .settings-group small {
        color: #aaa;
        font-size: 12px;
        margin-top: 5px;
        display: block;
      }

      .settings-group select:focus,
      .settings-group input:focus,
      .settings-group textarea:focus {
        outline: none;
        border-color: #C400FF;
        box-shadow: 0 0 0 2px rgba(196, 0, 255, 0.2);
      }

      .settings-group input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7F00FF, #C400FF);
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(176, 62, 255, 0.3);
      }

      .settings-group input[type="range"]::-webkit-slider-track {
        width: 100%;
        height: 6px;
        cursor: pointer;
        background: #2d2d2d;
        border-radius: 3px;
        border: 1px solid #B03EFF;
      }

      .settings-group input[type="range"]::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7F00FF, #C400FF);
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(176, 62, 255, 0.3);
      }

      .settings-group input[type="range"]::-moz-range-track {
        width: 100%;
        height: 6px;
        cursor: pointer;
        background: #2d2d2d;
        border-radius: 3px;
        border: 1px solid #B03EFF;
      }
    `;
    document.head.appendChild(style);
  }

  private getSettingsTemplate(): string {
    return `
      <div class="settings-header">
        <h3>Mock Interview Settings</h3>
        <p>Configure your interview experience</p>
      </div>
      
      <div class="settings-group">
        <label for="apiKey">Gemini API Key</label>
        <input type="password" id="apiKey" placeholder="Enter your Gemini API key" />
        <small>Your API key is stored locally in your browser.</small>
      </div>

      <div class="settings-group">
        <label for="deepgramApiKey">Deepgram API Key (Optional)</label>
        <input type="password" id="deepgramApiKey" placeholder="Enter your Deepgram API key" />
        <small>Enable live transcription of your speech.</small>
      </div>
      
      <div class="settings-group">
        <label for="voice">AI Voice</label>
        <select id="voice">
          <option value="Puck">Puck</option>
          <option value="Charon">Charon</option>
          <option value="Kore">Kore</option>
          <option value="Fenrir">Fenrir</option>
          <option value="Aoede">Aoede</option>
        </select>
      </div>

      <div class="settings-group">
        <label for="sampleRate">Sample Rate</label>
        <input type="range" id="sampleRate" min="8000" max="48000" step="1000">
        <div class="range-value" id="sampleRateValue"></div>
      </div>
      
      <div class="settings-group">
        <div class="collapsible" id="systemInstructionsToggle">System Instructions ▼</div>
        <div class="collapsible-content" id="systemInstructionsContent">
          <textarea id="systemInstructions" rows="4" placeholder="Customize the AI interviewer's behavior...">You are a professional interviewer conducting a mock interview. Ask relevant questions, provide constructive feedback, and help the candidate improve their interview skills.</textarea>
        </div>
      </div>

      <div class="settings-group">
        <div class="collapsible" id="screenCameraToggle">Screen & Camera ▼</div>
        <div class="collapsible-content" id="screenCameraContent">
          <div class="settings-group">
            <label for="fps">FPS (1-10)</label>
            <input type="range" id="fps" min="1" max="10" step="1">
            <div class="range-value" id="fpsValue"></div>
          </div>
          <div class="settings-group">
            <label for="resizeWidth">Resize Width (640-1920)</label>
            <input type="range" id="resizeWidth" min="640" max="1920" step="80">
            <div class="range-value" id="resizeWidthValue"></div>
          </div>
          <div class="settings-group">
            <label for="quality">Quality (0.1-1)</label>
            <input type="range" id="quality" min="0.1" max="1" step="0.1">
            <div class="range-value" id="qualityValue"></div>
          </div>
        </div>
      </div>

      <div class="settings-group">
        <div class="collapsible" id="advancedToggle">Advanced Settings ▼</div>
        <div class="collapsible-content" id="advancedContent">
          <div class="settings-group">
            <label for="temperature">Temperature (0-2)</label>
            <input type="range" id="temperature" min="0" max="2" step="0.1">
            <div class="range-value" id="temperatureValue"></div>
          </div>
          <div class="settings-group">
            <label for="topP">Top P (0-1)</label>
            <input type="range" id="topP" min="0" max="1" step="0.05">
            <div class="range-value" id="topPValue"></div>
          </div>
          <div class="settings-group">
            <label for="topK">Top K (1-100)</label>
            <input type="range" id="topK" min="1" max="100" step="1">
            <div class="range-value" id="topKValue"></div>
          </div>
        </div>
      </div>
      
      <button id="settingsSaveBtn" class="settings-save-btn">Save Settings</button>
    `;
  }

  private setupEventListeners(): void {
    if (!this.dialog || !this.overlay) return;

    this.overlay.addEventListener('click', () => this.hide());
    
    this.dialog.addEventListener('click', (e) => e.stopPropagation());
    
    const saveBtn = this.dialog.querySelector('#settingsSaveBtn') as HTMLButtonElement;
    saveBtn?.addEventListener('click', () => {
      this.saveSettings();
      this.hide();
    });

    // Setup collapsible sections
    this.setupCollapsible('systemInstructionsToggle', 'systemInstructionsContent');
    this.setupCollapsible('screenCameraToggle', 'screenCameraContent');
    this.setupCollapsible('advancedToggle', 'advancedContent');

    // Setup range inputs
    this.setupRangeInputs();
  }

  private setupCollapsible(toggleId: string, contentId: string): void {
    const toggle = this.dialog?.querySelector(`#${toggleId}`) as HTMLElement;
    const content = this.dialog?.querySelector(`#${contentId}`) as HTMLElement;
    
    if (toggle && content) {
      toggle.addEventListener('click', () => {
        const isActive = content.classList.contains('active');
        content.classList.toggle('active');
        const currentText = toggle.textContent || '';
        toggle.textContent = currentText.replace(isActive ? '▼' : '▲', isActive ? '▲' : '▼');
      });
    }
  }

  private setupRangeInputs(): void {
    const rangeInputs = ['sampleRate', 'fps', 'resizeWidth', 'quality', 'temperature', 'topP', 'topK'];
    rangeInputs.forEach(inputId => {
      const input = this.dialog?.querySelector(`#${inputId}`) as HTMLInputElement;
      const valueDisplay = this.dialog?.querySelector(`#${inputId}Value`) as HTMLElement;
      if (input && valueDisplay) {
        input.addEventListener('input', () => {
          this.updateRangeValue(inputId, input.value, valueDisplay);
        });
        // Initial display update
        this.updateRangeValue(inputId, input.value, valueDisplay);
      }
    });
  }

  private updateRangeValue(inputId: string, value: string, valueDisplay: HTMLElement): void {
    let displayValue = value;
    
    switch (inputId) {
      case 'sampleRate':
        displayValue = `${value} Hz`;
        break;
      case 'fps':
        displayValue = `${value} FPS`;
        break;
      case 'resizeWidth':
        displayValue = `${value}px`;
        break;
      case 'quality':
        displayValue = parseFloat(value).toFixed(1);
        break;
      case 'temperature':
        displayValue = parseFloat(value).toFixed(1);
        break;
      case 'topP':
        displayValue = parseFloat(value).toFixed(2);
        break;
      default:
        break;
    }
    
    valueDisplay.textContent = displayValue;
  }

  private loadSettings(): void {
    if (!this.dialog) return;

    const apiKeyInput = this.dialog.querySelector('#apiKey') as HTMLInputElement;
    const deepgramApiKeyInput = this.dialog.querySelector('#deepgramApiKey') as HTMLInputElement;
    const voiceSelect = this.dialog.querySelector('#voice') as HTMLSelectElement;
    const sampleRateInput = this.dialog.querySelector('#sampleRate') as HTMLInputElement;
    const systemInstructionsInput = this.dialog.querySelector('#systemInstructions') as HTMLTextAreaElement;
    const fpsInput = this.dialog.querySelector('#fps') as HTMLInputElement;
    const resizeWidthInput = this.dialog.querySelector('#resizeWidth') as HTMLInputElement;
    const qualityInput = this.dialog.querySelector('#quality') as HTMLInputElement;
    const temperatureInput = this.dialog.querySelector('#temperature') as HTMLInputElement;
    const topPInput = this.dialog.querySelector('#topP') as HTMLInputElement;
    const topKInput = this.dialog.querySelector('#topK') as HTMLInputElement;

    if (apiKeyInput) apiKeyInput.value = this.getStorageItem('apiKey', '');
    if (deepgramApiKeyInput) deepgramApiKeyInput.value = this.getStorageItem('deepgramApiKey', '');
    if (voiceSelect) voiceSelect.value = this.getStorageItem('voiceName', 'Aoede');
    if (sampleRateInput) sampleRateInput.value = this.getStorageItem('sampleRate', '27000');
    if (systemInstructionsInput) systemInstructionsInput.value = this.getStorageItem('systemInstructions', 'You are a professional interviewer conducting a mock interview. Ask relevant questions, provide constructive feedback, and help the candidate improve their interview skills.');
    if (fpsInput) fpsInput.value = this.getStorageItem('fps', '5');
    if (resizeWidthInput) resizeWidthInput.value = this.getStorageItem('resizeWidth', '640');
    if (qualityInput) qualityInput.value = this.getStorageItem('quality', '0.4');
    if (temperatureInput) temperatureInput.value = this.getStorageItem('temperature', '1.8');
    if (topPInput) topPInput.value = this.getStorageItem('top_p', '0.95');
    if (topKInput) topKInput.value = this.getStorageItem('top_k', '65');

    this.updateAllRangeValues();
  }

  private updateAllRangeValues(): void {
    const rangeInputs = ['sampleRate', 'fps', 'resizeWidth', 'quality', 'temperature', 'topP', 'topK'];
    
    rangeInputs.forEach(inputId => {
      const input = this.dialog?.querySelector(`#${inputId}`) as HTMLInputElement;
      const valueDisplay = this.dialog?.querySelector(`#${inputId}Value`) as HTMLElement;
      
      if (input && valueDisplay) {
        this.updateRangeValue(inputId, input.value, valueDisplay);
      }
    });
  }

  private saveSettings(): void {
    if (!this.dialog) return;

    const apiKeyInput = this.dialog.querySelector('#apiKey') as HTMLInputElement;
    const deepgramApiKeyInput = this.dialog.querySelector('#deepgramApiKey') as HTMLInputElement;
    const voiceSelect = this.dialog.querySelector('#voice') as HTMLSelectElement;
    const sampleRateInput = this.dialog.querySelector('#sampleRate') as HTMLInputElement;
    const systemInstructionsInput = this.dialog.querySelector('#systemInstructions') as HTMLTextAreaElement;
    const fpsInput = this.dialog.querySelector('#fps') as HTMLInputElement;
    const resizeWidthInput = this.dialog.querySelector('#resizeWidth') as HTMLInputElement;
    const qualityInput = this.dialog.querySelector('#quality') as HTMLInputElement;
    const temperatureInput = this.dialog.querySelector('#temperature') as HTMLInputElement;
    const topPInput = this.dialog.querySelector('#topP') as HTMLInputElement;
    const topKInput = this.dialog.querySelector('#topK') as HTMLInputElement;

    if (apiKeyInput) this.setStorageItem('apiKey', apiKeyInput.value);
    if (deepgramApiKeyInput) this.setStorageItem('deepgramApiKey', deepgramApiKeyInput.value);
    if (voiceSelect) this.setStorageItem('voiceName', voiceSelect.value);
    if (sampleRateInput) this.setStorageItem('sampleRate', sampleRateInput.value);
    if (systemInstructionsInput) this.setStorageItem('systemInstructions', systemInstructionsInput.value);
    if (fpsInput) this.setStorageItem('fps', fpsInput.value);
    if (resizeWidthInput) this.setStorageItem('resizeWidth', resizeWidthInput.value);
    if (qualityInput) this.setStorageItem('quality', qualityInput.value);
    if (temperatureInput) this.setStorageItem('temperature', temperatureInput.value);
    if (topPInput) this.setStorageItem('top_p', topPInput.value);
    if (topKInput) this.setStorageItem('top_k', topKInput.value);

    console.info('Settings saved successfully');
    window.location.reload();
  }

  show(): void {
    if (this.dialog && this.overlay) {
      this.dialog.classList.add('active');
      this.overlay.classList.add('active');
    }
  }

  hide(): void {
    if (this.dialog && this.overlay) {
      this.dialog.classList.remove('active');
      this.overlay.classList.remove('active');
    }
  }
}
