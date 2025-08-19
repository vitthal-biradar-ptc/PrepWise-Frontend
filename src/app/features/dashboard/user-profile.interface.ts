export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  location: string;
  domainBadge: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioLink: string | null;
  profilePhoto: string;
  skills: BackendSkill[];
  certifications: BackendCertification[];
  achievements: BackendAchievement[];
  domainData: DomainData;
}

export interface BackendSkill {
  id: number;
  name: string;
  proficiency: string;
}

export interface BackendCertification {
  id: number;
  name: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface BackendAchievement {
  id: number;
  name: string;
  description: string;
  date: string;
}

export interface DomainData {
  labels: string[];
  datasets: [{
    data: number[];
  }];
}

// Add interface for the complete update payload
export interface UpdateProfilePayload {
  name: string;
  email: string;
  location: string;
  domainBadge: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioLink: string | null;
  profilePhoto: string;
  skills: BackendSkill[];
  certifications: BackendCertification[];
  achievements: BackendAchievement[];
  domainData: DomainData;
}
