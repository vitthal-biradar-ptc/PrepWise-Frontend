/** Message exchanged during a mock interview session. */
export interface ChatMessage {
  id: string;
  type: 'user' | 'model';
  text: string;
  timestamp: Date;
  streaming?: boolean;
}

/** Runtime configuration for interview generation and TTS. */
export interface InterviewConfig {
  temperature: number;
  topP: number;
  topK: number;
  voiceName: string;
  systemInstructions: string;
  sampleRate: number;
}

/** A single interview question. */
export interface InterviewQuestion {
  id: number;
  text: string;
  category?: string;
}

/** In-memory representation of an interview in progress. */
export interface InterviewSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
}

/** Feedback summary returned after completing an interview. */
export interface InterviewFeedback {
  strengths: string[];
  improvementAreas: string[];
  overallScore?: number;
  detailedFeedback?: string;
}

/** Structured feedback format for persistent storage and interoperability. */
export interface StructuredInterviewFeedback {
  candidateDetails: {
    name: string;
    role: string;
    experienceLevel: string;
    dateOfInterview: string; // YYYY-MM-DD
  };
  overallSummary: string;
  evaluationCriteria: Array<{
    skillArea: string;
    rating: number; // 1-5
    comments: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  suggestedResources: string[];
  finalVerdict: string;
}

/** Tool call request used by the model for function calling. */
export interface ToolCallRequest {
  name: string;
  args: any;
  id: string;
}

/** Tool call response result and potential error information. */
export interface ToolCallResponse {
  output: any;
  id: string;
  error: string | null;
}

/** Websocket connection status codes for realtime interviews. */
export enum ConnectionStatus {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  ERROR = 3
}

/** Safety thresholds used by the generative model. */
export interface SafetySettings {
  harassmentThreshold: string;
  dangerousContentThreshold: string;
  sexuallyExplicitThreshold: string;
  hateSpeechThreshold: string;
  civicIntegrityThreshold: string;
}

/** Valid difficulty levels. */
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

/** Interview setup payload before starting a session. */
export interface InterviewSetup {
  role: string;
  level: DifficultyLevel | ''; // Allow empty string for form validation
  userId?: string;
}

/** Final interview result persisted after a session ends. */
export interface InterviewResult {
  id: string;
  userId: string;
  role: string;
  level: DifficultyLevel; // Only valid levels allowed in results
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  questions: InterviewQuestionResult[];
  feedback: InterviewFeedback;
  overallScore: number;
  // Persisted in required JSON structure
  structuredFeedback?: StructuredInterviewFeedback;
}

/** Scored result for a single interview question. */
export interface InterviewQuestionResult {
  question: string;
  userAnswer: string;
  correctAnswer?: string;
  feedback?: string;
  score?: number;
}

/** Summary card metadata for displaying past interviews. */
export interface InterviewCard {
  id: string;
  title: string;
  category: string;
  level: DifficultyLevel; // Use the type here too
  time: string;
  questions: number;
  progress: number;
  status: 'completed' | 'in-progress' | 'not-started';
}
