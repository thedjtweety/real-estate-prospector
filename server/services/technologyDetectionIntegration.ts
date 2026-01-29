/**
 * Technology Detection Integration
 * 
 * Integrates website and job posting technology analysis into the search pipeline
 */

import { analyzeWebsiteTechnology, normalizeUrl, type DetectedTechnology } from './websiteTechnologyAnalyzer';
import { analyzeJobPostingTechnologies, type DetectedJobTechnology } from './jobPostingTechnologyAnalyzer';

export interface TechnologyStackProfile {
  website: DetectedTechnology[];
  jobPostings: DetectedJobTechnology[];
  topTechnologies: string[]; // Most likely technologies used
  confidence: number; // Overall confidence in detected technologies
  summary: string; // Human-readable summary
}

/**
 * Analyze complete technology stack for a brokerage
 */
export async function analyzeBrokerageTechnologyStack(
  websiteUrl: string | undefined,
  jobPostings: string[] = []
): Promise<TechnologyStackProfile> {
  console.log('[TechStack] Analyzing brokerage technology stack');

  const result: TechnologyStackProfile = {
    website: [],
    jobPostings: [],
    topTechnologies: [],
    confidence: 0,
    summary: '',
  };

  // Analyze website if provided
  if (websiteUrl) {
    try {
      const normalizedUrl = normalizeUrl(websiteUrl);
      result.website = await analyzeWebsiteTechnology(normalizedUrl);
      console.log(`[TechStack] Found ${result.website.length} technologies on website`);
    } catch (error: any) {
      console.error('[TechStack] Website analysis failed:', error.message);
    }
  }

  // Analyze job postings if provided
  if (jobPostings.length > 0) {
    try {
      result.jobPostings = analyzeJobPostingTechnologies(jobPostings);
      console.log(`[TechStack] Found ${result.jobPostings.length} technologies in job postings`);
    } catch (error: any) {
      console.error('[TechStack] Job posting analysis failed:', error.message);
    }
  }

  // Merge and rank technologies
  const technologyMap = new Map<string, { count: number; confidence: number }>();

  // Add website technologies
  for (const tech of result.website) {
    const key = tech.platform.id;
    if (!technologyMap.has(key)) {
      technologyMap.set(key, { count: 1, confidence: tech.confidence });
    } else {
      const existing = technologyMap.get(key)!;
      existing.count += 1;
      existing.confidence = Math.max(existing.confidence, tech.confidence);
    }
  }

  // Add job posting technologies
  for (const tech of result.jobPostings) {
    const key = tech.platform.id;
    if (!technologyMap.has(key)) {
      technologyMap.set(key, { count: 1, confidence: tech.confidence });
    } else {
      const existing = technologyMap.get(key)!;
      existing.count += 1;
      existing.confidence = Math.max(existing.confidence, tech.confidence);
    }
  }

  // Sort by count and confidence
  result.topTechnologies = Array.from(technologyMap.entries())
    .sort((a, b) => {
      const countDiff = b[1].count - a[1].count;
      if (countDiff !== 0) return countDiff;
      return b[1].confidence - a[1].confidence;
    })
    .slice(0, 5)
    .map(([id]) => id);

  // Calculate overall confidence
  if (technologyMap.size > 0) {
    const confidences = Array.from(technologyMap.values()).map(t => t.confidence);
    result.confidence = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
  }

  // Generate summary
  result.summary = generateTechnologySummary(result);

  console.log(`[TechStack] Top technologies: ${result.topTechnologies.join(', ')}`);
  console.log(`[TechStack] Overall confidence: ${result.confidence}%`);

  return result;
}

/**
 * Generate human-readable summary of technology stack
 */
function generateTechnologySummary(profile: TechnologyStackProfile): string {
  if (profile.topTechnologies.length === 0) {
    return 'No transaction management platforms detected.';
  }

  const platformNames = profile.topTechnologies.slice(0, 3).join(', ');
  const confidenceLevel = profile.confidence >= 80 ? 'high' : profile.confidence >= 60 ? 'moderate' : 'low';

  return `Likely uses ${platformNames} (${confidenceLevel} confidence).`;
}

/**
 * Format technology detection results for display
 */
export function formatTechnologyResults(profile: TechnologyStackProfile): string {
  let output = '## Technology Stack\n\n';

  if (profile.topTechnologies.length === 0) {
    output += 'No transaction management platforms detected.\n';
    return output;
  }

  output += `**Detected Platforms:** ${profile.topTechnologies.join(', ')}\n`;
  output += `**Confidence:** ${profile.confidence}%\n\n`;

  if (profile.website.length > 0) {
    output += '### Website Detection\n';
    for (const tech of profile.website.slice(0, 3)) {
      output += `- **${tech.platform.name}** (${tech.confidence}% confidence)\n`;
      output += `  - Source: ${tech.source}\n`;
      output += `  - Evidence: ${tech.evidence}\n`;
    }
    output += '\n';
  }

  if (profile.jobPostings.length > 0) {
    output += '### Job Posting Detection\n';
    for (const tech of profile.jobPostings.slice(0, 3)) {
      output += `- **${tech.platform.name}** (${tech.confidence}% confidence)\n`;
      output += `  - Mentioned in ${tech.jobPostings} job posting(s)\n`;
      if (tech.requiredSkills.length > 0) {
        output += `  - Required skills: ${tech.requiredSkills.slice(0, 3).join(', ')}\n`;
      }
    }
  }

  return output;
}
