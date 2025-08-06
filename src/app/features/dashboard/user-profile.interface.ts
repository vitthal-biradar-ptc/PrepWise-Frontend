export interface UserProfile {
  name: string;
  email: string;
  location: string;
  domainBadge: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioLink: string;
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
