/**
 * Job Posting Technology Analyzer
 * 
 * Analyzes job postings from LinkedIn and other sources to detect
 * transaction management platforms and technologies required by brokerages
 */

import { 
  findPlatformsByKeyword,
  TRANSACTION_PLATFORMS,
  type TransactionPlatform 
} from './transactionManagementDB';

export interface DetectedJobTechnology {
  platform: TransactionPlatform;
  jobPostings: number; // How many job postings mention this technology
  confidence: number; // 0-100
  requiredSkills: string[]; // Skills mentioned alongside the platform
}

/**
 * Analyze job postings for technology requirements
 */
export function analyzeJobPostingTechnologies(
  jobPostings: string[]
): DetectedJobTechnology[] {
  console.log(`[JobTech] Analyzing ${jobPostings.length} job postings for technologies`);

  const detectedMap = new Map<string, DetectedJobTechnology>();

  for (const posting of jobPostings) {
    const postingLower = posting.toLowerCase();

    // Search for each platform in the job posting
    for (const platform of TRANSACTION_PLATFORMS) {
      for (const keyword of platform.keywords) {
        if (postingLower.includes(keyword.toLowerCase())) {
          const key = platform.id;

          if (!detectedMap.has(key)) {
            detectedMap.set(key, {
              platform,
              jobPostings: 1,
              confidence: 85,
              requiredSkills: [],
            });
          } else {
            const existing = detectedMap.get(key)!;
            existing.jobPostings += 1;
            // Increase confidence if mentioned in multiple postings
            existing.confidence = Math.min(95, existing.confidence + 5);
          }

          // Extract skills mentioned with this platform
          const skills = extractSkillsForPlatform(posting, keyword);
          const existing = detectedMap.get(key)!;
          existing.requiredSkills = Array.from(new Set([...existing.requiredSkills, ...skills]));

          break;
        }
      }
    }
  }

  const result = Array.from(detectedMap.values())
    .sort((a, b) => b.jobPostings - a.jobPostings);

  console.log(`[JobTech] Found ${result.length} technologies in job postings`);
  return result;
}

/**
 * Extract skills mentioned in context of a platform
 */
function extractSkillsForPlatform(posting: string, platformKeyword: string): string[] {
  const skills: string[] = [];

  // Common skills associated with real estate technology
  const skillPatterns = [
    /(?:experience|proficiency|knowledge|expertise|skilled|proficient)\s+(?:with|in|using|on)\s+([a-zA-Z\s]+?)(?:\.|,|;|and|or|$)/g,
    /(?:required|must have|required skills?|key skills?|core competencies?)\s*:?\s*([a-zA-Z\s,]+?)(?:\.|$)/g,
  ];

  for (const pattern of skillPatterns) {
    let match;
    while ((match = pattern.exec(posting)) !== null) {
      const skillText = match[1].trim();
      const extractedSkills = skillText
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length < 50);

      skills.push(...extractedSkills);
    }
  }

  // Common real estate technology skills
  const commonSkills = [
    'crm',
    'mls',
    'transaction management',
    'salesforce',
    'lead management',
    'customer relationship management',
    'real estate software',
    'database management',
    'data entry',
    'reporting',
    'analytics',
    'microsoft office',
    'excel',
    'word',
    'outlook',
    'google workspace',
    'slack',
    'zoom',
    'communication',
    'customer service',
    'sales',
  ];

  for (const skill of commonSkills) {
    if (posting.toLowerCase().includes(skill)) {
      skills.push(skill);
    }
  }

  return Array.from(new Set(skills));
}

/**
 * Analyze multiple job postings and return top technologies
 */
export function getTopTechnologiesFromJobPostings(
  jobPostings: string[],
  topN: number = 5
): DetectedJobTechnology[] {
  const detected = analyzeJobPostingTechnologies(jobPostings);
  return detected.slice(0, topN);
}

/**
 * Check if a job posting mentions transaction management
 */
export function hasTransactionManagementMention(jobPosting: string): boolean {
  const postingLower = jobPosting.toLowerCase();

  for (const platform of TRANSACTION_PLATFORMS) {
    for (const keyword of platform.keywords) {
      if (postingLower.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extract technology requirements from job posting text
 */
export function extractTechnologyRequirements(jobPosting: string): string[] {
  const requirements: string[] = [];

  // Look for "Requirements" or "Required Skills" sections
  const requirementPatterns = [
    /requirements?[\s:]*(.+?)(?=\n\n|$)/,
    /required skills?[\s:]*(.+?)(?=\n\n|$)/,
    /qualifications?[\s:]*(.+?)(?=\n\n|$)/,
    /key responsibilities?[\s:]*(.+?)(?=\n\n|$)/,
  ];

  for (const pattern of requirementPatterns) {
    const match = jobPosting.match(pattern);
    if (match && match[1]) {
      const text = match[1];
      // Extract bullet points or comma-separated items
      const items = text.split(/[\n•-]/).map(item => item.trim()).filter(item => item.length > 0);
      requirements.push(...items);
    }
  }

  return requirements;
}
