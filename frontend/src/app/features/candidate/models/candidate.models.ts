/** Feature 3 — Candidate side (ahmed & samy). Backend: CandidateController. */
export interface CandidateProfile {
  candidateId: number;
  name: string;
  email: string;
  age: number;
  educationLevel: string;
  universityTier: string;
  cgpa: number;
  internships: number;
  projects: number;
  programmingLanguages: number;
  certifications: number;
  experienceYears: number;
  hackathons: number;
  researchPapers: number;
  skillsScore: number;
  softSkillsScore: number;
  resumeLengthWords: number;
  companyType: string;
  skills?: string | null;
  bio?: string | null;
  hasCv: boolean;
  cvFileName?: string | null;
}

export interface UpsertProfileRequest {
  age: number;
  educationLevel: string;
  universityTier: string;
  cgpa: number;
  internships: number;
  projects: number;
  programmingLanguages: number;
  certifications: number;
  experienceYears: number;
  hackathons: number;
  researchPapers: number;
  skillsScore: number;
  softSkillsScore: number;
  resumeLengthWords: number;
  companyType: string;
  skills?: string;
  bio?: string;
}

export interface MyApplication {
  id: number;
  jobId: number;
  jobTitle: string;
  appliedAt: string;
  status: string;
  matchScore: number | null;
}

/** Percentage 0–100 while a CV uploads. */
export type UploadProgress = number;

/** One AI-ranked job suggestion (backend: GET /api/Candidate/recommended-jobs). */
export interface RecommendedJob {
  jobId: number;
  title: string;
  company: string;
  requiredSkills: string;
  experienceRequired: number;
  /** 0–100 fit score produced by the AI pipeline. */
  score: number;
  /** One-sentence explanation of why this job matches. */
  reason: string;
  generatedAt: string;
}

/** AI summary of the uploaded CV (backend: GET /api/Candidate/cv-analysis). */
export interface CvAnalysis {
  skills: string[];
  experienceYears: number;
  summary: string;
  hasCvAnalysis: boolean;
}
