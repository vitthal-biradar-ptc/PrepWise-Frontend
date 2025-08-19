import { Injectable } from '@angular/core';
import { GeminiAgentService } from './gemini-agent.service';
import { ChatManagerService } from './chat-manager.service';
import { ConfigService } from './config.service';
import { ToolManagerService } from './tool-manager.service';
import { InterviewResultsService } from './interview-results.service';
import { InterviewSetup, InterviewResult, InterviewQuestionResult, DifficultyLevel, StructuredInterviewFeedback } from '../../../models/interview.models';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private isInterviewActive = false;
  private interviewStartTime: Date | null = null;
  private currentQuestionIndex = 0;
  private currentSetup: InterviewSetup | null = null;
  private interviewQuestions: string[] = [];
  private userAnswers: string[] = [];
  private currentInterviewId: string | null = null;
  
  constructor(
    private geminiAgent: GeminiAgentService,
    private chatManager: ChatManagerService,
    private configService: ConfigService,
    private toolManager: ToolManagerService,
    private interviewResultsService: InterviewResultsService
  ) {}

  async startInterview(setup: InterviewSetup): Promise<void> {
    try {
      console.log('=== STARTING INTERVIEW ===');
      console.log('Setup:', setup);
      
      this.currentSetup = setup;
      this.isInterviewActive = true;
      this.interviewStartTime = new Date();
      this.currentQuestionIndex = 0;
      this.interviewQuestions = [];
      this.userAnswers = [];
      this.currentInterviewId = this.generateInterviewId();

      // Ensure agent is connected
      console.log('Checking agent connection...');
      if (!this.geminiAgent.isConnected()) {
        console.log('Agent not connected, attempting connection...');
        await this.geminiAgent.connect();
        console.log('✓ Agent connected');
      }
      
      // Initialize if not already done
      console.log('Checking agent initialization...');
      if (!this.geminiAgent.isInitialized()) {
        console.log('Initializing agent...');
        await this.geminiAgent.initialize();
        console.log('✓ Agent initialized');
      }

      // Wait a moment to ensure everything is ready
      console.log('Waiting for systems to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send initial interview instruction
      const initialPrompt = this.generateInitialPrompt(setup);
      
      console.log('Sending initial interview prompt...');
      await this.geminiAgent.sendSystemMessage(initialPrompt);
      
      console.log('✓ Mock interview started successfully');
      console.info('Interview setup complete:', setup);
      
    } catch (error) {
      console.error('=== INTERVIEW START FAILED ===');
      console.error('Error details:', error);
      
      // Clean up on failure
      this.isInterviewActive = false;
      this.currentSetup = null;
      this.currentInterviewId = null;
      this.interviewQuestions = [];
      this.userAnswers = [];
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to start interview: ${error.message}`);
      } else {
        throw new Error('Failed to start interview due to unknown error');
      }
    }
  }

  private generateInitialPrompt(setup: InterviewSetup): string {
    const levelInstructions = {
      'Easy': 'Focus on basic concepts, fundamental knowledge, and common interview questions. Be encouraging and supportive.',
      'Medium': 'Include scenario-based questions, practical examples, and moderate complexity. Provide constructive feedback.',
      'Hard': 'Challenge with advanced concepts, complex problem-solving, and industry-specific scenarios. Maintain professional rigor.'
    };

    // New, more detailed and limiting prompt
    return `
You are conducting a ${setup.level.toLowerCase()} level mock interview for a ${setup.role} position.

${levelInstructions[setup.level as keyof typeof levelInstructions]}

Rules:
- Be concise and on-point; avoid digressions and long preambles.
- Ask ONE question at a time.
- Keep to a maximum of 6 total questions unless the candidate explicitly asks for more.
- After each answer, you may briefly acknowledge or give a short nudge (≤ 1 sentence).
- When finished with the planned questions, clearly suggest that the candidate can disconnect.
- Then produce FINAL structured feedback as TEXT (not spoken) in PURE JSON ONLY with exactly the keys below (no backticks, no fences, no extra commentary):
{
  "overallSummary": "string",
  "evaluationCriteria": [
    { "skillArea": "string", "rating": 1-5, "comments": "string" }
  ],
  "strengths": ["string", "..."],
  "areasForImprovement": ["string", "..."],
  "suggestedResources": ["string", "..."],
  "finalVerdict": "string"
}
Important: Do NOT read the JSON aloud. Include it as a text response part only. Output only the JSON for the final feedback.

Start by greeting the candidate briefly and asking them to introduce themselves in one concise question.
`.trim();
  }

  async endInterview(): Promise<InterviewResult | null> {
    try {
      if (this.isInterviewActive && this.currentSetup) {
        // Replace generic closing prompt with explicit JSON-only request
        const closingPrompt = `
Provide the FINAL structured feedback now as PURE JSON ONLY (no Markdown, no code fences, no extra text), with exactly this schema and keys:
{
  "overallSummary": "string",
  "evaluationCriteria": [
    { "skillArea": "string", "rating": 1-5, "comments": "string" }
  ],
  "strengths": ["string", "..."],
  "areasForImprovement": ["string", "..."],
  "suggestedResources": ["string", "..."],
  "finalVerdict": "string"
}
Do NOT speak the JSON. Return it as a text response part only, and include nothing else.
`.trim();

        await this.geminiAgent.sendText(closingPrompt);
        // Wait a bit for the response to complete
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate interview result
        const result = this.generateInterviewResult();

        // Build structured feedback in required JSON format (uses parsed fields if available)
        result.structuredFeedback = this.buildStructuredFeedback(result);

        this.isInterviewActive = false;
        this.currentSetup = null;
        this.currentInterviewId = null;

        console.info('Mock interview ended, result generated:', result);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error ending interview:', error);
      throw error;
    }
  }

  private generateInterviewResult(): InterviewResult {
    if (!this.interviewStartTime || !this.currentSetup) {
      throw new Error('Cannot generate result without interview data');
    }

    // Validate that setup has proper level before creating result
    if (!this.currentSetup.level || (this.currentSetup.level as string) === '') {
      throw new Error('Invalid interview setup: level is required');
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - this.interviewStartTime.getTime()) / 60000); // in minutes

    // Parse the last AI message to extract feedback
    const messages = this.chatManager.getMessages();
    const lastAIMessage = messages.filter(m => m.type === 'model').pop();
    
    const feedback = this.parseFeedbackFromMessage(lastAIMessage?.text || '');
    
    return {
      id: this.currentInterviewId!,
      userId: this.getUserIdFromCookies(),
      role: this.currentSetup.role,
      level: this.currentSetup.level as DifficultyLevel, // Type assertion after validation
      startTime: this.interviewStartTime,
      endTime: endTime,
      duration: duration,
      questions: this.interviewQuestions.map((q, i) => ({
        question: q,
        userAnswer: this.userAnswers[i] || 'No answer provided',
        feedback: 'Feedback will be generated by AI'
      })),
      feedback: feedback,
      overallScore: feedback.overallScore || 7
    };
  }

  private buildStructuredFeedback(result: InterviewResult): StructuredInterviewFeedback {
    const dateIso = new Date(result.endTime).toISOString().slice(0, 10);
    const summary = (result.feedback.detailedFeedback || '').trim() || 'Summary not provided.';
    const strengths = result.feedback.strengths?.length ? result.feedback.strengths : ['Demonstrated relevant skills'];
    const improvements = result.feedback.improvementAreas?.length ? result.feedback.improvementAreas : ['Practice interview scenarios'];
    const overallScore = Math.max(1, Math.min(10, result.overallScore || 7));

    // Heuristic ratings (1-5) from overall score
    const scoreToFive = (s: number) => Math.max(1, Math.min(5, Math.round(s / 2)));
    const baseRating = scoreToFive(overallScore);

    const evaluationCriteria = [
      { skillArea: 'Technical Knowledge', rating: baseRating, comments: strengths[0] || 'Solid understanding of fundamentals.' },
      { skillArea: 'Problem-Solving', rating: Math.max(1, baseRating - 1), comments: improvements[0] || 'Work on optimization and structured approach.' },
      { skillArea: 'Communication', rating: baseRating, comments: 'Clear articulation and structured responses.' },
      { skillArea: 'Confidence', rating: Math.max(1, baseRating - 1), comments: 'Improve confidence when explaining complex topics.' }
    ];

    return {
      candidateDetails: {
        name: 'Anonymous',
        role: result.role,
        experienceLevel: result.level,
        dateOfInterview: dateIso
      },
      overallSummary: summary,
      evaluationCriteria,
      strengths,
      areasForImprovement: improvements,
      suggestedResources: [
        'LeetCode for coding practice',
        'System Design Primer'
      ],
      finalVerdict: overallScore >= 7 ? 'Good' : overallScore >= 5 ? 'Needs improvement' : 'Needs significant improvement'
    };
  }

  private parseFeedbackFromMessage(message: string): any {
    // First, attempt to parse the expected JSON directly (robust to extra text)
    const tryParseJson = (text: string): any | null => {
      try {
        return JSON.parse(text);
      } catch {
        // Try to extract the first JSON object-like block
        const match = text.match(/\{[\s\S]*\}$/m) || text.match(/\{[\s\S]*\}/m);
        if (match) {
          try { return JSON.parse(match[0]); } catch {}
        }
        return null;
      }
    };

    const parsed = tryParseJson(message || '');
    if (parsed && typeof parsed === 'object') {
      // Map parsed JSON to our feedback shape
      const evals = Array.isArray(parsed.evaluationCriteria) ? parsed.evaluationCriteria : [];
      const ratings = evals
        .map((e: any) => Number(e?.rating))
        .filter((n: number) => Number.isFinite(n) && n >= 1 && n <= 5);
      const avg5 = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : 3.5;
      const overallScore = Math.max(1, Math.min(10, Math.round(avg5 * 2)));

      return {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvementAreas: Array.isArray(parsed.areasForImprovement) ? parsed.areasForImprovement : [],
        overallScore,
        detailedFeedback: typeof parsed.overallSummary === 'string' ? parsed.overallSummary : message
      };
    }

    // Fallback: simple heuristic parsing (existing behavior)
    const feedback = {
      strengths: [] as string[],
      improvementAreas: [] as string[],
      overallScore: 7,
      detailedFeedback: message
    };

    const scoreMatch = message.match(/score.*?(\d+)/i);
    if (scoreMatch) {
      const s = parseInt(scoreMatch[1]);
      if (Number.isFinite(s)) feedback.overallScore = s;
    }

    const lines = (message || '').split('\n');
    let currentSection = '';
    for (const line of lines) {
      if (line.toLowerCase().includes('strength')) {
        currentSection = 'strengths';
      } else if (line.toLowerCase().includes('improvement') || line.toLowerCase().includes('area')) {
        currentSection = 'improvement';
      } else if (line.trim() && currentSection) {
        if (currentSection === 'strengths') feedback.strengths.push(line.trim());
        if (currentSection === 'improvement') feedback.improvementAreas.push(line.trim());
      }
    }

    return feedback;
  }

  async askNextQuestion(): Promise<void> {
    if (this.currentQuestionIndex < this.interviewQuestions.length - 1) {
      this.currentQuestionIndex++;
      const nextQuestion = this.interviewQuestions[this.currentQuestionIndex];
      
      const prompt = `Please ask the next interview question: "${nextQuestion}"`;
      await this.geminiAgent.sendText(prompt);
    } else {
      // No more questions, wrap up the interview
      await this.endInterview();
    }
  }

  recordQuestion(question: string): void {
    this.interviewQuestions.push(question);
  }

  recordAnswer(answer: string): void {
    this.userAnswers.push(answer);
  }

  getCurrentQuestion(): string | null {
    if (this.currentQuestionIndex < this.interviewQuestions.length) {
      return this.interviewQuestions[this.currentQuestionIndex];
    }
    return null;
  }

  getInterviewProgress(): { current: number; total: number; percentage: number } {
    const total = this.interviewQuestions.length;
    const current = this.currentQuestionIndex + 1;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    return { current, total, percentage };
  }

  getInterviewDuration(): number {
    if (!this.interviewStartTime) return 0;
    return Date.now() - this.interviewStartTime.getTime();
  }

  isActive(): boolean {
    return this.isInterviewActive;
  }

  getCurrentSetup(): InterviewSetup | null {
    return this.currentSetup;
  }

  resetInterview(): void {
    this.isInterviewActive = false;
    this.interviewStartTime = null;
    this.currentQuestionIndex = 0;
    this.currentSetup = null;
    this.currentInterviewId = null;
    this.interviewQuestions = [];
    this.userAnswers = [];
    this.chatManager.clear();
  }

  private generateInterviewId(): string {
    return `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserIdFromCookies(): string {
    // Extract user ID from cookies - implement based on your auth system
    const token = this.getCookie('auth_token');
    if (token) {
      // Decode JWT token to get user ID
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId || 'unknown';
      } catch (e) {
        console.warn('Failed to decode auth token');
      }
    }
    return 'anonymous';
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  async saveInterviewResult(result: InterviewResult): Promise<void> {
    try {
      // Save using the interview results service
      await this.interviewResultsService.saveInterviewResult(result);
      console.info('Interview result saved successfully');
    } catch (error) {
      console.error('Error saving interview result:', error);
      throw error;
    }
  }
}
