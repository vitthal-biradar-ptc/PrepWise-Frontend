/** Backend user profile model returned by the API. */
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

/** Backend skill representation used in persistence. */
export interface BackendSkill {
  id: number;
  name: string;
  proficiency: string;
}

/** Backend certification representation used in persistence. */
export interface BackendCertification {
  id: number;
  name: string;
  issuer?: string;
  date?: string;
  description?: string;
}

/** Backend achievement representation used in persistence. */
export interface BackendAchievement {
  id: number;
  name: string;
  description: string;
  date: string;
}

/** Minimal chart dataset structure for the domain pie chart. */
export interface DomainData {
  labels: string[];
  datasets: [{
    data: number[];
  }];
}

/** Complete update payload shape expected by the backend. */
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
