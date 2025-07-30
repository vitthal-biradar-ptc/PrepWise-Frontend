export interface ResumeAnalysisRequest {
  prompt: string;
}

export interface ResumeAnalysisResponse {
  domain: string;
  suggestions: string[];
}
