import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { TranscriptItem, PerformanceReport } from '../mock-interview';

export interface NextStep {
  feedback: string | null;
  nextQuestion: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiKey = environment.geminiApiKey;
  private model = 'gemini-2.5-flash';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  private formatTranscript(transcript: TranscriptItem[]): string {
    return transcript
      .filter(item => item.speaker !== 'feedback')
      .map(item => `${item.speaker.toUpperCase()}: ${item.text}`)
      .join('\n');
  }

  async startInterview(jobRole: string, experienceLevel: string): Promise<string> {
    if (!this.apiKey) {
      return `Hi, I'm Alex. Let's begin your ${jobRole} interview. Can you tell me about yourself and your experience with ${jobRole}?`;
    }

    const prompt = `You are Alex, an expert AI interviewer hiring for a ${jobRole} position requiring a ${experienceLevel} level of experience. Start the mock interview with a VERY BRIEF introduction (1-2 lines maximum) and immediately ask the first, most relevant technical or behavioral question. Keep your entire response under 3 sentences total. Your response must be only the brief introduction and question, without any other text.`;
    
    try {
      const response = await this.makeRequest(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error starting interview:', error);
      return `Hi, I'm Alex. Let's begin your ${jobRole} interview. Can you tell me about yourself and your experience with ${jobRole}?`;
    }
  }

  async getNextQuestion(transcript: TranscriptItem[], jobRole: string, experienceLevel: string): Promise<NextStep> {
    if (!this.apiKey) {
      const fallbackQuestions = [
        "That's interesting. Can you walk me through a challenging project you've worked on?",
        "How do you handle tight deadlines and pressure?",
        "What technologies are you most comfortable working with?",
        "How do you approach problem-solving in your work?",
        "Can you describe a time when you had to learn something new quickly?",
        "What motivates you in your work?",
        "How do you handle feedback and criticism?",
        "Tell me about a time you worked in a team."
      ];
      
      const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      
      return {
        feedback: "Thank you for sharing that with me.",
        nextQuestion: randomQuestion
      };
    }

    const formattedTranscript = this.formatTranscript(transcript);
    const prompt = `You are an expert interviewer for a ${jobRole} position at a ${experienceLevel} level. Here is the interview transcript so far:

${formattedTranscript}

Based on the candidate's last answer, provide two things in JSON format: 
1. "feedback": A concise, constructive critique of their most recent answer (2-3 sentences max).
2. "nextQuestion": The next logical follow-up question. Vary between technical and behavioral questions.

Your response must be only the JSON object with no additional text.`;

    try {
      const response = await this.makeRequest(prompt, true);
      return JSON.parse(response) as NextStep;
    } catch (e) {
      console.error('Failed to get next question:', e);
      return {
        feedback: "Thank you for your answer.",
        nextQuestion: "Can you tell me about a challenging project you've worked on?"
      };
    }
  }

  async generateReport(transcript: TranscriptItem[], jobRole: string, experienceLevel: string): Promise<PerformanceReport> {
    if (!this.apiKey || transcript.length < 4) {
      return {
        overallSummary: `Thank you for completing the ${jobRole} interview. You demonstrated good communication skills and shared relevant experiences. Your responses showed understanding of the role requirements.`,
        strengths: [
          "Good communication skills",
          "Relevant experience shared",
          "Professional demeanor",
          "Clear explanations"
        ],
        areasForImprovement: [
          "Could provide more specific examples",
          "Consider elaborating on technical details",
          "Practice structuring responses using STAR method"
        ],
        questionByQuestionAnalysis: this.generateFallbackAnalysis(transcript)
      };
    }

    const formattedTranscript = this.formatTranscript(transcript);
    const prompt = `You are an expert career coach providing feedback for a mock interview. The candidate was interviewing for a ${jobRole} position at a ${experienceLevel} level. 
    
    Analyze the following transcript and provide a comprehensive performance report:
    
    ${formattedTranscript}
    
    Provide your response in JSON format with this exact structure:
    {
      "overallSummary": "Brief overall assessment",
      "strengths": ["strength1", "strength2", "strength3"],
      "areasForImprovement": ["area1", "area2", "area3"],
      "questionByQuestionAnalysis": [
        {
          "question": "The AI question",
          "userAnswer": "The user's response", 
          "feedback": "Specific feedback",
          "score": 7
        }
      ]
    }`;

    try {
      const response = await this.makeRequest(prompt, true);
      return JSON.parse(response) as PerformanceReport;
    } catch (e) {
      console.error('Failed to generate report:', e);
      return {
        overallSummary: "Interview completed successfully. Thank you for participating.",
        strengths: ["Good communication skills", "Professional demeanor"],
        areasForImprovement: ["Technical knowledge", "Problem-solving approach"],
        questionByQuestionAnalysis: this.generateFallbackAnalysis(transcript)
      };
    }
  }

  private generateFallbackAnalysis(transcript: TranscriptItem[]) {
    const analysis = [];
    const aiQuestions = transcript.filter(item => item.speaker === 'ai');
    
    for (let i = 0; i < Math.min(aiQuestions.length, 3); i++) {
      const question = aiQuestions[i];
      const userResponse = transcript.find(item => 
        item.speaker === 'user' && item.id > question.id
      );
      
      analysis.push({
        question: question.text,
        userAnswer: userResponse?.text || "No response recorded",
        feedback: "Good attempt. Consider providing more specific examples in future responses.",
        score: Math.floor(Math.random() * 3) + 6
      });
    }
    
    return analysis;
  }

  private async makeRequest(prompt: string, expectJson: boolean = false): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: expectJson ? {
        response_mime_type: "application/json"
      } : {}
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}
