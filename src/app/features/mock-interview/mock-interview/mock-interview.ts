import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleGenAI, Type } from '@google/genai';
import { HeaderComponent } from '../../../core/layout/header/header';
import { InterviewReport, InterviewService, SaveInterviewRequest } from '../services/interview.service';
import { UserProfileService } from '../../../services/user-profile.service';
import { environment } from '../../../../environments/environment';


/**
 * Mock interview experience with speech recognition, TTS, and fullscreen.
 */
@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './mock-interview.html',
  styleUrl: './mock-interview.css',
})
export class MockInterview implements OnInit, OnDestroy {
  // UI State
  public readonly AppView = {
    SETUP: 0,
    INTERVIEW: 1,
    REPORT: 2,
  } as const;
  public currentView: 0 | 1 | 2 = this.AppView.SETUP;

  // Setup form
  public jobRole = '';
  public experienceLevel = 'Mid-Level';

  // Interview state
  public transcript: TranscriptItem[] = [];
  public aiStatus: 'thinking' | 'speaking' | 'idle' = 'idle';
  public isListening = false;
  protected recognition: any | null = null;
  public recognitionSupported = false;
  public recognitionError: string | null = null;

  // Camera
  @ViewChild('cameraVideo') cameraVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('chatContainer') chatContainerRef?: ElementRef<HTMLDivElement>;
  public cameraError: string | null = null;
  public cameraStream: MediaStream | null = null;

  // Report state
  public isLoading = false;
  public error: string | null = null;
  public report: PerformanceReport | null = null;

  // Interview timing
  public interviewStartTime: Date | null = null;
  public interviewEndTime: Date | null = null;

  // Platform
  private readonly platformId = inject(PLATFORM_ID);
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Gemini client (lazy)
  private aiClient: GoogleGenAI | null = null;
  private readonly modelName = 'gemini-2.5-flash';
  private readonly requestTimeoutMs = 45000;
  private readonly zone = inject(NgZone);

  // Fullscreen state
  public isFullscreen = false;
  public showFullscreenExitWarning = false;
  private fullscreenChangeHandler?: () => void;
  // Services
  private readonly interviewService = inject(InterviewService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    // Setup fullscreen change listener
    this.fullscreenChangeHandler = () => {
      this.zone.run(() => {
        this.handleFullscreenChange();
      });
    };

    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    document.addEventListener(
      'webkitfullscreenchange',
      this.fullscreenChangeHandler
    );
    document.addEventListener(
      'mozfullscreenchange',
      this.fullscreenChangeHandler
    );
    document.addEventListener(
      'MSFullscreenChange',
      this.fullscreenChangeHandler
    );

    // Setup Speech Recognition
    const SpeechRecognitionImpl: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionImpl) {
      this.recognitionSupported = true;
      this.recognition = new SpeechRecognitionImpl();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.onerror = (event: any) => {
        this.zone.run(() => {
          this.recognitionError = `Speech recognition error: ${
            event?.error ?? 'unknown'
          }`;
          this.isListening = false;
        });
      };
      this.recognition.onend = () => {
        this.zone.run(() => {
          this.isListening = false;
        });
      };
      this.recognition.onstart = () => {
        this.zone.run(() => {
          this.isListening = true;
          this.recognitionError = null;
        });
      };
      this.recognition.onresult = (event: any) => {
        // Process only final results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res.isFinal) {
            const text = (res[0]?.transcript ?? '').trim();
            if (text) {
              this.zone.run(() => {
                // Stop listening to avoid capturing TTS or further noise
                this.stopListening();
                this.handleUserSpeech(text);
              });
            }
          }
        }
      };
    } else {
      this.recognitionSupported = false;
      this.recognitionError =
        'Speech recognition is not supported in this browser.';
    }
  }

  ngOnDestroy(): void {
    // Remove fullscreen listeners
    if (this.fullscreenChangeHandler) {
      document.removeEventListener(
        'fullscreenchange',
        this.fullscreenChangeHandler
      );
      document.removeEventListener(
        'webkitfullscreenchange',
        this.fullscreenChangeHandler
      );
      document.removeEventListener(
        'mozfullscreenchange',
        this.fullscreenChangeHandler
      );
      document.removeEventListener(
        'MSFullscreenChange',
        this.fullscreenChangeHandler
      );
    }

    // Exit fullscreen if active
    this.exitFullscreen();

    // Stop camera
    this.cameraStream?.getTracks().forEach((t) => t.stop());
    this.cameraStream = null;
    // Stop recognition
    try {
      this.recognition?.stop?.();
    } catch {}
    // Stop TTS
    if (this.isBrowser && (window as any).speechSynthesis) {
      (window as any).speechSynthesis.cancel();
    }
  }

  // Setup View actions
  protected async startInterviewFromSetup(): Promise<void> {
    if (!this.jobRole.trim()) return;

    // Record interview start time
    this.interviewStartTime = new Date();

    // Enter fullscreen before starting interview
    try {
      await this.enterFullscreen();
    } catch (error) {
      console.warn('Could not enter fullscreen:', error);
      // Continue with interview even if fullscreen fails
    }

    this.transcript = [];
    this.report = null;
    this.error = null;
    this.currentView = this.AppView.INTERVIEW;
    queueMicrotask(() => {
      this.setupCamera();
      this.beginInterview();
    });
  }

  // Interview flow
  protected toggleListening(): void {
    if (!this.recognitionSupported || !this.recognition) return;
    if (this.isListening) {
      this.stopListening();
    } else if (this.aiStatus === 'idle') {
      this.startListening();
    }
  }

  protected startListening(): void {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
      this.recognitionError = null;
      this.isListening = true;
    } catch (e) {
      this.recognitionError =
        'Could not start recognition. Please check permissions.';
      this.isListening = false;
    }
  }

  protected stopListening(): void {
    try {
      this.recognition?.stop?.();
    } catch {}
    this.isListening = false;
  }

  private async beginInterview(): Promise<void> {
    this.aiStatus = 'thinking';
    this.scrollOnThinking();
    try {
      const firstQuestion = await this.withTimeout(
        this.callStartInterview(this.jobRole, this.experienceLevel),
        this.requestTimeoutMs,
        'startInterview'
      );
      const firstItem: TranscriptItem = {
        id: Date.now(),
        speaker: 'ai',
        text: firstQuestion,
      };
      this.transcript = [firstItem];
      this.scrollToBottom();
      this.speak(firstQuestion);
    } catch (err) {
      console.error('[MockInterview] beginInterview failed', err);
      this.error =
        "I'm sorry, I'm having trouble starting the interview. Please check your network/API key and try again.";
      this.transcript = [{ id: Date.now(), speaker: 'ai', text: this.error }];
      this.scrollToBottom();
      this.aiStatus = 'idle';
    }
  }

  private handleUserSpeech(userText: string): void {
    if (!userText) return;
    const userItem: TranscriptItem = {
      id: Date.now(),
      speaker: 'user',
      text: userText,
    };
    // Stop listening while AI processes and speaks to avoid self-capture
    this.stopListening();
    this.aiStatus = 'thinking';
    this.transcript = [...this.transcript, userItem];
    this.scrollToBottom();
    this.scrollOnThinking();
    this.getFollowUp([...this.transcript]);
  }

  private async getFollowUp(
    currentTranscript: TranscriptItem[]
  ): Promise<void> {
    try {
      const next = await this.withTimeout(
        this.callGetNextQuestion(
          currentTranscript,
          this.jobRole,
          this.experienceLevel
        ),
        this.requestTimeoutMs,
        'nextQuestion'
      );
      const newItems: TranscriptItem[] = [];
      if (next.feedback) {
        newItems.push({
          id: Date.now() + 1,
          speaker: 'feedback',
          text: next.feedback,
        });
      }
      newItems.push({
        id: Date.now() + 2,
        speaker: 'ai',
        text: next.nextQuestion,
      });
      this.transcript = [...this.transcript, ...newItems];
      this.scrollToBottom();
      this.speak(next.nextQuestion);
    } catch (err) {
      console.error('[MockInterview] getFollowUp failed', err);
      const errorItem: TranscriptItem = {
        id: Date.now() + 3,
        speaker: 'ai',
        text: "I'm sorry, I encountered an error. Let's try that again.",
      };
      this.transcript = [...this.transcript, errorItem];
      this.scrollToBottom();
      this.speak(errorItem.text);
    }
  }

  protected endInterview(): void {
    // Record interview end time
    this.interviewEndTime = new Date();

    // Exit fullscreen when ending interview
    this.exitFullscreen();

    this.currentView = this.AppView.REPORT;
    this.isLoading = true;
    this.error = null;
    this.withTimeout(
      this.generatePerformanceReport([...this.transcript]),
      this.requestTimeoutMs,
      'report'
    )
      .then((rep) => {
        this.report = rep;
        // Save interview data after generating report
        return this.saveInterviewData(rep);
      })
      .then((report: InterviewReport | undefined) => {
        // navigate to report view
        if (report) {
          this.router.navigate([
            `/interview-reports/user/${report.userId}/report/${report.id}`,
          ]);
        }
      })
      .catch((err) => {
        console.error('[MockInterview] generatePerformanceReport failed', err);
        this.error =
          'Sorry, there was an error generating your performance report. Please try again.';
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  private async saveInterviewData(
    report: PerformanceReport
  ): Promise<InterviewReport | undefined> {
    if (!this.interviewStartTime || !this.interviewEndTime) {
      console.warn('Interview start/end time not recorded');
      return Promise.resolve(undefined);
    }

    try {
      // Get user ID from profile service
      const userId = await this.userProfileService
        .getUserIdCached()
        .toPromise();

      if (!userId) {
        throw new Error('User ID not found');
      }
      // Calculate duration in minutes
      const durationMs =
        this.interviewEndTime.getTime() - this.interviewStartTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      // Calculate overall score (average of question scores)
      const overallScore =
        report.questionByQuestionAnalysis.length > 0
          ? report.questionByQuestionAnalysis.reduce(
              (sum, q) => sum + q.score,
              0
            ) / report.questionByQuestionAnalysis.length
          : 7;

      // Generate recommendations based on areas for improvement
      const recommendations =
        report.areasForImprovement.length > 0
          ? `Focus on: ${report.areasForImprovement.join(
              ', '
            )}. Consider practicing with mock interviews and reviewing fundamental concepts in these areas.`
          : 'Great job! Continue practicing to maintain your performance level.';

      const saveRequest: SaveInterviewRequest = {
        userId: userId,
        role: this.jobRole,
        level: this.experienceLevel,
        startTime: this.interviewStartTime.toISOString().split('.')[0],
        endTime: this.interviewEndTime.toISOString().split('.')[0],
        duration: durationMinutes,
        transcript: this.transcript.map((item, index) => ({
          speaker: this.mapSpeakerName(item.speaker),
          text: item.text,
          timestamp: new Date(
            this.interviewStartTime!.getTime() + index * 30000
          )
            .toISOString()
            .split('.')[0], // Approximate timestamps
        })),
        feedback: {
          overallSummary: report.overallSummary,
          strengths: report.strengths,
          weaknesses: report.areasForImprovement,
          recommendations: recommendations,
        },
        overallScore: Math.round(overallScore),
      };

      const response = await this.interviewService
        .saveInterview(saveRequest)
        .toPromise();

      return response;
    } catch (error) {
      console.error('Error saving interview data:', error);
      // Don't show error to user as the interview is already complete
      return undefined;
    }
  }

  private mapSpeakerName(speaker: 'user' | 'ai' | 'feedback'): string {
    switch (speaker) {
      case 'ai':
        return 'Interviewer';
      case 'user':
        return 'Candidate';
      case 'feedback':
        return 'Interviewer'; // Feedback is treated as interviewer comment
      default:
        return 'Interviewer';
    }
  }

  protected startAgain(): void {
    // Reset interview timing
    this.interviewStartTime = null;
    this.interviewEndTime = null;

    // Exit fullscreen when starting again
    this.exitFullscreen();

    this.jobRole = '';
    this.experienceLevel = 'Mid-Level';
    this.transcript = [];
    this.report = null;
    this.error = null;
    this.aiStatus = 'idle';
    this.isListening = false;
    this.currentView = this.AppView.SETUP;
    this.showFullscreenExitWarning = false;
  }

  protected getScoreColor(score: number): string {
    if (score >= 8) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  }

  public trackById(_index: number, item: TranscriptItem): number {
    return item.id;
  }

  // Fullscreen warning handlers
  protected continueInterviewInFullscreen(): void {
    this.showFullscreenExitWarning = false;
    this.enterFullscreen().catch(() => {
      // If can't re-enter fullscreen, force exit interview
      this.forceExitInterview();
    });
  }

  protected confirmExitInterview(): void {
    this.showFullscreenExitWarning = false;
    this.forceExitInterview();
  }

  private forceExitInterview(): void {
    // Stop all interview activities
    this.stopListening();
    if (this.isBrowser && (window as any).speechSynthesis) {
      (window as any).speechSynthesis.cancel();
    }

    // Reset to setup without generating report
    this.startAgain();
  }

  // Fullscreen management
  private async enterFullscreen(): Promise<void> {
    if (!this.isBrowser) return;

    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      throw new Error('Fullscreen request failed');
    }
  }

  private exitFullscreen(): void {
    if (!this.isBrowser) return;

    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.warn('Exit fullscreen failed:', error);
    }
  }

  private isDocumentInFullscreen(): boolean {
    if (!this.isBrowser) return false;

    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  private handleFullscreenChange(): void {
    const wasFullscreen = this.isFullscreen;
    this.isFullscreen = this.isDocumentInFullscreen();

    // If we exited fullscreen during interview, show warning
    if (
      wasFullscreen &&
      !this.isFullscreen &&
      this.currentView === this.AppView.INTERVIEW
    ) {
      this.showFullscreenExitWarning = true;
    }
  }

  // Auto-scroll chat to bottom
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainerRef?.nativeElement) {
        const container = this.chatContainerRef.nativeElement;
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  // Scroll to bottom when AI starts thinking
  private scrollOnThinking(): void {
    setTimeout(() => {
      this.scrollToBottom();
    }, 50);
  }

  // Camera
  private async setupCamera(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      // Request only video to keep the microphone free for SpeechRecognition
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (this.cameraVideoRef?.nativeElement) {
        this.cameraVideoRef.nativeElement.srcObject = this.cameraStream;
      }
    } catch (err) {
      this.cameraError =
        'Camera access denied. Please enable permissions in your browser.';
    }
  }

  // TTS
  private speak(text: string): void {
    if (!this.isBrowser || !(window as any).speechSynthesis) {
      // If TTS unsupported, just mark idle so user can continue
      this.aiStatus = 'idle';
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    // Ensure we don't capture TTS via mic
    this.stopListening();
    utterance.onstart = () => {
      this.zone.run(() => {
        this.aiStatus = 'speaking';
      });
    };
    utterance.onend = () => {
      this.zone.run(() => {
        this.aiStatus = 'idle';
      });
    };
    utterance.onerror = () => {
      this.zone.run(() => {
        this.aiStatus = 'idle';
      });
    };
    // Prefer a non-system voice to improve recognition separation
    try {
      const voices = (window as any).speechSynthesis.getVoices?.() as
        | SpeechSynthesisVoice[]
        | undefined;
      const preferred = voices?.find(
        (v) => /en/i.test(v.lang) && !/Microsoft|System/i.test(v.name)
      );
      if (preferred) utterance.voice = preferred;
    } catch {}
    (window as any).speechSynthesis.cancel();
    (window as any).speechSynthesis.speak(utterance);
  }

  // Gemini helpers
  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      if (!environment.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }
      this.aiClient = new GoogleGenAI({ apiKey: environment.geminiApiKey });
    }
    return this.aiClient;
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string
  ): Promise<T> {
    let timeoutHandle: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result as T;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private formatTranscript(items: TranscriptItem[]): string {
    return items
      .filter((i) => i.speaker !== 'feedback')
      .map((i) => `${i.speaker.toUpperCase()}: ${i.text}`)
      .join('\n');
  }

  private async callStartInterview(
    jobRole: string,
    experienceLevel: string
  ): Promise<string> {
    const prompt = `You are Alex, an expert AI interviewer hiring for a ${jobRole} position requiring a ${experienceLevel} level of experience. Start the mock interview with a VERY BRIEF introduction (1-2 lines maximum) and immediately ask the first, most relevant technical or behavioral question. Keep your entire response under 3 sentences total. Your response must be only the brief introduction and question, without any other text.`;
    const ai = this.getClient();
    const response: any = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
    });
    return this.extractText(response);
  }

  private async callGetNextQuestion(
    transcript: TranscriptItem[],
    jobRole: string,
    experienceLevel: string
  ): Promise<NextStep> {
    const formatted = this.formatTranscript(transcript);
    const prompt = `You are an expert interviewer for a ${jobRole} position at a ${experienceLevel} level. Here is the interview transcript so far:\n\n${formatted}\n\nBased on the candidate's last answer, provide two things in JSON format: 
  1.  "feedback": A concise, constructive critique of their most recent answer. This feedback should be brief and direct.
  2.  "nextQuestion": The next logical follow-up question. If the previous question was technical, consider asking a behavioral question, and vice-versa.
  Your response must be only the JSON object.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        feedback: { type: Type.STRING },
        nextQuestion: { type: Type.STRING },
      },
      required: ['feedback', 'nextQuestion'],
    } as const;

    const ai = this.getClient();
    const response: any = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema as any,
      },
    });
    const jsonText = this.extractText(response);
    try {
      return JSON.parse(jsonText) as NextStep;
    } catch {
      throw new Error('Invalid JSON response from AI for the next question.');
    }
  }

  private async generatePerformanceReport(
    transcript: TranscriptItem[]
  ): Promise<PerformanceReport> {
    const formatted = this.formatTranscript(transcript);
    const prompt = `You are an expert career coach providing feedback for a mock interview. The candidate was interviewing for a ${this.jobRole} position at a ${this.experienceLevel} level. 
    
    Analyze the following transcript and provide a comprehensive performance report.
    
    Transcript:
    ${formatted}
    
    Your analysis should be critical but constructive. For the question-by-question analysis, provide specific feedback on the user's answer and a score from 1 to 10. The user's answers are labeled 'USER'. The AI's questions are labeled 'AI'.
    
    Provide your response in the specified JSON format.`;

    const reportSchema = {
      type: Type.OBJECT,
      properties: {
        overallSummary: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
        questionByQuestionAnalysis: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              userAnswer: { type: Type.STRING },
              feedback: { type: Type.STRING },
              score: { type: Type.NUMBER },
            },
            required: ['question', 'userAnswer', 'feedback', 'score'],
          },
        },
      },
      required: [
        'overallSummary',
        'strengths',
        'areasForImprovement',
        'questionByQuestionAnalysis',
      ],
    } as const;

    const ai = this.getClient();
    const response: any = await ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: reportSchema as any,
      },
    });
    const jsonText = this.extractText(response);
    try {
      return JSON.parse(jsonText) as PerformanceReport;
    } catch {
      throw new Error('Invalid JSON response from AI.');
    }
  }

  private extractText(resp: any): string {
    try {
      if (!resp) return '';
      const t = (resp as any).text;
      if (typeof t === 'function') {
        const val = t.call(resp);
        if (typeof val === 'string') return val.trim();
      }
      if (typeof t === 'string') return t.trim();
      const cand = (resp as any).candidates?.[0]?.content?.parts;
      if (Array.isArray(cand)) {
        return cand
          .map((p: any) => p?.text ?? '')
          .join('')
          .trim();
      }
      return '';
    } catch {
      return '';
    }
  }
}

// Local types for this feature
export interface TranscriptItem {
  id: number;
  speaker: 'user' | 'ai' | 'feedback';
  text: string;
}

interface NextStep {
  feedback: string | null;
  nextQuestion: string;
}

export interface PerformanceReport {
  overallSummary: string;
  strengths: string[];
  areasForImprovement: string[];
  questionByQuestionAnalysis: Array<{
    question: string;
    userAnswer: string;
    feedback: string;
    score: number;
  }>;
}
