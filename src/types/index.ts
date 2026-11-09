export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';
export type JobLevel = 'Fresh Graduate' | 'Junior' | 'Mid-Level' | 'Senior' | 'Lead / Manager';
export type ApplicationStatus = 'Antrean' | 'Terkirim' | 'Ditinjau HR' | 'Wawancara' | 'Penawaran' | 'Ditolak';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  level: JobLevel;
  department: string;
  salaryRange: string;
  postedDate: string;
  source: 'LinkedIn' | 'JobStreet' | 'Glints' | 'Kalibrr' | 'Direct HR' | 'TechInAsia';
  hrEmail: string;
  description: string;
  requirements: string[];
  skills: string[];
  screeningQuestions: string[];
  logoBg?: string;
  companyInitial?: string;
  applyUrl?: string;
  portalRefId?: string;
}

export interface PortalConnection {
  id: 'glints' | 'jobstreet' | 'linkedin' | 'kalibrr' | 'techinasia';
  name: string;
  sourceType: 'Glints' | 'JobStreet' | 'LinkedIn' | 'Kalibrr' | 'TechInAsia';
  connected: boolean;
  lastSync: string;
  jobCount: number;
  syncStatus: 'active' | 'syncing' | 'idle';
  portalUrl: string;
  logoText: string;
  logoBg: string;
}

export interface CandidateProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  primaryRole: string;
  experienceYears: number;
  expectedSalary: string;
  availability: string;
  linkedin: string;
  github?: string;
  portfolio?: string;
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    graduationYear: string;
  }[];
  resumeFileName?: string;
  resumeFileSize?: string;
}

export interface QueueItem {
  id: string;
  job: Job;
  addedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressStep?: string;
  error?: string;
  trackingId?: string;
  generatedCoverLetter?: string;
  answers?: string[];
}

export interface ApplicationRecord {
  id: string;
  trackingId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  hrEmail: string;
  appliedAt: string;
  status: ApplicationStatus;
  matchScore: number;
  coverLetter: string;
  screeningAnswers?: { question: string; answer: string }[];
  deliveryMethod: string;
  mailtoUrl?: string;
  notes?: string;
  lastFollowUpAt?: string;
}

export interface MatchAnalysisResult {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  recommendedKeywords: string[];
  atsAdvice: string;
}

export interface AutoApplyConfig {
  delaySeconds: number;
  language: 'id' | 'en';
  tone: 'formal' | 'impactful' | 'creative';
  autoAnswerQuestions: boolean;
  attachPortfolio: boolean;
  autoEmailDispatch: boolean;
}
