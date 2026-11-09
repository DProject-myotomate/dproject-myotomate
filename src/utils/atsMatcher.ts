import { CandidateProfile, Job } from '../types';

export function calculateJobMatch(candidate: CandidateProfile, job: Job): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase().trim());
  const jobSkills = (job.skills || []).map((s) => s.toLowerCase().trim());

  const matched: string[] = [];
  const missing: string[] = [];

  job.skills.forEach((rawSkill) => {
    const sLower = rawSkill.toLowerCase().trim();
    const isDirectMatch = candidateSkills.some(
      (cs) => cs === sLower || cs.includes(sLower) || sLower.includes(cs)
    );
    if (isDirectMatch) {
      matched.push(rawSkill);
    } else {
      missing.push(rawSkill);
    }
  });

  // Check role title match
  const candidateRoleLower = candidate.primaryRole.toLowerCase();
  const jobTitleLower = job.title.toLowerCase();
  let roleBonus = 0;
  if (
    jobTitleLower.includes('frontend') && candidateRoleLower.includes('frontend') ||
    jobTitleLower.includes('fullstack') && candidateRoleLower.includes('fullstack') ||
    jobTitleLower.includes('product') && candidateRoleLower.includes('product') ||
    jobTitleLower.includes('marketing') && candidateRoleLower.includes('marketing') ||
    jobTitleLower.includes('data') && candidateRoleLower.includes('data') ||
    jobTitleLower.includes('backend') && (candidateRoleLower.includes('backend') || candidateRoleLower.includes('fullstack'))
  ) {
    roleBonus = 15;
  }

  // Calculate score
  const totalSkills = Math.max(job.skills.length, 1);
  const skillRatio = matched.length / totalSkills;
  let rawScore = Math.round(skillRatio * 75 + roleBonus + 10);

  // Clamp score between 45 and 98
  const score = Math.max(45, Math.min(98, rawScore));

  return {
    score,
    matchedSkills: matched,
    missingSkills: missing,
  };
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
