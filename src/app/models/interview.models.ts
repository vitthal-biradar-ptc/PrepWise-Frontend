export interface ChatMessage {
  id: string;
  type: 'user' | 'model';
  text: string;
  timestamp: Date;
  streaming?: boolean;
}

export interface InterviewConfig {
  temperature: number;
  topP: number;
  topK: number;
  voiceName: string;
  systemInstructions: string;
  sampleRate: number;
}

export interface InterviewQuestion {
  id: number;
  text: string;
  category?: string;
}

export interface InterviewSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
}

export interface InterviewFeedback {
  strengths: string[];
  improvementAreas: string[];
  overallScore?: number;
  detailedFeedback?: string;
}

// Structured feedback format for persistent storage and interoperability
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

export interface ToolCallRequest {
  name: string;
  args: any;
  id: string;
}

export interface ToolCallResponse {
  output: any;
  id: string;
  error: string | null;
}

export enum ConnectionStatus {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  ERROR = 3
}

export interface SafetySettings {
  harassmentThreshold: string;
  dangerousContentThreshold: string;
  sexuallyExplicitThreshold: string;
  hateSpeechThreshold: string;
  civicIntegrityThreshold: string;
}

// Define valid difficulty levels
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

// New interfaces for interview setup and results
export interface InterviewSetup {
  role: string;
  level: DifficultyLevel | ''; // Allow empty string for form validation
  userId?: string;
}

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

export interface InterviewQuestionResult {
  question: string;
  userAnswer: string;
  correctAnswer?: string;
  feedback?: string;
  score?: number;
}

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
