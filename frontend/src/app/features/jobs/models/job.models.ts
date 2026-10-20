/** Feature 2 — Jobs (omar: browsing, amgad: management). Backend is ready. */
export interface Job {
  id: number;
  hrid: number;
  title: string;
  description: string;
  /** Comma-separated on the wire; split in the UI. */
  requiredSkills: string;
  experienceRequired: number;
  isActive: boolean;
  createdAt: string;
}

export interface JobFilter {
  search?: string;
  /** Show jobs requiring at most this many years. */
  maxExperience?: number | null;
  activeOnly?: boolean;
}

export interface CreateJobRequest {
  hrid: number;
  title: string;
  description: string;
  requiredSkills: string;
  experienceRequired: number;
}

export interface UpdateJobRequest {
  title: string;
  description: string;
  requiredSkills: string;
  experienceRequired: number;
}

export interface MyHr {
  hrId: number;
  companyName: string;
}
