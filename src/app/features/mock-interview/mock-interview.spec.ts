import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockInterviewComponent } from './mock-interview';
import { GeminiAgentService } from './services/gemini-agent.service';
import { ChatManagerService } from './services/chat-manager.service';
import { SettingsService } from './services/settings.service';
import { InterviewService } from './services/interview.service';
import { of } from 'rxjs';
import { ElementRef } from '@angular/core';

describe('MockInterviewComponent', () => {
  let component: MockInterviewComponent;
  let fixture: ComponentFixture<MockInterviewComponent>;
  let geminiAgentServiceSpy: jasmine.SpyObj<GeminiAgentService>;
  let chatManagerServiceSpy: jasmine.SpyObj<ChatManagerService>;
  let settingsServiceSpy: jasmine.SpyObj<SettingsService>;
  let interviewServiceSpy: jasmine.SpyObj<InterviewService>;

  beforeEach(async () => {
    const gaSpy = jasmine.createSpyObj('GeminiAgentService', [
      'connect', 'disconnect', 'initialize', 'toggleMic', 
      'startCameraCapture', 'stopCameraCapture', 'startScreenShare', 
      'stopScreenShare', 'sendText', 'onTranscription', 'onTextSent',
      'onInterrupted', 'onTurnComplete', 'onUserTranscription', 'onScreenShareStopped'
    ]);
    
    const cmSpy = jasmine.createSpyObj('ChatManagerService', [
      'startModelMessage', 'updateStreamingMessage', 'finalizeStreamingMessage',
      'addUserMessage', 'addUserAudioMessage', 'clear', 'getMessages'
    ]);
    
    const ssSpy = jasmine.createSpyObj('SettingsService', ['show']);
    
    const isSpy = jasmine.createSpyObj('InterviewService', [
      'startInterview', 'endInterview'
    ]);

    // Setup mock return values
    gaSpy.onTranscription.and.returnValue();
    gaSpy.onTextSent.and.returnValue();
    gaSpy.onInterrupted.and.returnValue();
    gaSpy.onTurnComplete.and.returnValue();
    gaSpy.onUserTranscription.and.returnValue();
    gaSpy.onScreenShareStopped.and.returnValue();
    cmSpy.getMessages.and.returnValue([]);

    await TestBed.configureTestingModule({
      declarations: [MockInterviewComponent],
      providers: [
        { provide: GeminiAgentService, useValue: gaSpy },
        { provide: ChatManagerService, useValue: cmSpy },
        { provide: SettingsService, useValue: ssSpy },
        { provide: InterviewService, useValue: isSpy }
      ]
    }).compileComponents();

    geminiAgentServiceSpy = TestBed.inject(GeminiAgentService) as jasmine.SpyObj<GeminiAgentService>;
    chatManagerServiceSpy = TestBed.inject(ChatManagerService) as jasmine.SpyObj<ChatManagerService>;
    settingsServiceSpy = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    interviewServiceSpy = TestBed.inject(InterviewService) as jasmine.SpyObj<InterviewService>;

    fixture = TestBed.createComponent(MockInterviewComponent);
    component = fixture.componentInstance;

    // Mock ViewChild references
    component.messageInput = { nativeElement: { value: '', focus: jasmine.createSpy('focus') } } as unknown as ElementRef;
    component.chatHistory = { nativeElement: {} } as ElementRef;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should connect to Gemini API', async () => {
    geminiAgentServiceSpy.connect.and.resolveTo();
    geminiAgentServiceSpy.initialize.and.resolveTo();
    
    await component.connect();
    
    expect(geminiAgentServiceSpy.connect).toHaveBeenCalled();
    expect(geminiAgentServiceSpy.initialize).toHaveBeenCalled();
  });

  it('should disconnect from Gemini API', async () => {
    geminiAgentServiceSpy.disconnect.and.resolveTo();
    
    // Set connected state first
    component['connectionStatus'] = 2; // CONNECTED
    
    await component.disconnect();
    
    expect(geminiAgentServiceSpy.disconnect).toHaveBeenCalled();
    expect(chatManagerServiceSpy.clear).toHaveBeenCalled();
  });

  it('should toggle microphone', async () => {
    geminiAgentServiceSpy.toggleMic.and.resolveTo();
    component['connectionStatus'] = 2; // CONNECTED
    
    await component.toggleMic();
    
    expect(geminiAgentServiceSpy.toggleMic).toHaveBeenCalled();
    expect(component.isMicActive).toBe(true);
  });

  it('should send a message', async () => {
    geminiAgentServiceSpy.sendText.and.resolveTo();
    component['connectionStatus'] = 2; // CONNECTED
    component.messageInput.nativeElement.value = 'test message';
    
    await component.sendMessage();
    
    expect(geminiAgentServiceSpy.sendText).toHaveBeenCalledWith('test message');
    expect(component.messageInput.nativeElement.value).toBe('');
  });
});
