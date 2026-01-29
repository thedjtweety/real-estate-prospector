/**
 * Contact Enrichment Analyzer
 * Analyzes search results to extract direct contact information for a specific person
 */

import { invokeGroq } from './groqLLM';
import { SearchResult } from './parallelSearchExecutor';

export interface EnrichedContactData {
  email?: string;
  emailConfidence: number;
  phone?: string;
  phoneConfidence: number;
  linkedinUrl?: string;
  linkedinConfidence: number;
  additionalInfo: string[];
  overallConfidence: number;
}

/**
 * Analyze search results to extract contact-specific information
 */
export async function analyzeContactEnrichment(
  searchResults: SearchResult[],
  contactInput: { name: string; company?: string; title?: string }
): Promise<EnrichedContactData> {
  console.log(`[ContactEnrichment] Analyzing enrichment data for: ${contactInput.name}`);

  // Prepare context from search results
  const context = searchResults
    .map(sr => {
      const resultsText = sr.results
        .slice(0, 5) // Limit to top 5 results per query
        .map(r => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description}`)
        .join('\n\n');
      return `Search: "${sr.query}"\nResults:\n${resultsText}`;
    })
    .join('\n\n---\n\n');

  const prompt = `You are analyzing search results to find direct contact information for a specific person.

Person Being Enriched:
- Name: ${contactInput.name}
- Company: ${contactInput.company || 'Unknown'}
- Title: ${contactInput.title || 'Unknown'}

Search Results:
${context.slice(0, 12000)}

Extract contact information in JSON format:
{
  "email": "Direct email address if found (not generic info@ or contact@)",
  "emailConfidence": 0-100,
  "phone": "Direct phone or mobile number if found",
  "phoneConfidence": 0-100,
  "linkedinUrl": "Full LinkedIn profile URL if found",
  "linkedinConfidence": 0-100,
  "additionalInfo": ["Any other useful information found"],
  "overallConfidence": 0-100
}

Important:
- Only extract information that clearly belongs to ${contactInput.name}
- Email must be a personal/direct email, not generic company emails
- Phone should be direct line or mobile, not main office number
- LinkedIn URL must be the person's profile, not company page
- Set confidence based on how certain you are it's the correct person
- Leave fields null if not found (don't make up data)
- additionalInfo can include: social media profiles, awards, certifications, etc.`;

  try {
    const response = await invokeGroq({
      messages: [
        { role: 'system', content: 'You are an expert at extracting contact information from search results. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content) as EnrichedContactData;

    console.log(`[ContactEnrichment] Enrichment complete for ${contactInput.name}:`);
    console.log(`  Email: ${result.email || 'Not found'} (${result.emailConfidence}% confidence)`);
    console.log(`  Phone: ${result.phone || 'Not found'} (${result.phoneConfidence}% confidence)`);
    console.log(`  LinkedIn: ${result.linkedinUrl ? 'Found' : 'Not found'} (${result.linkedinConfidence}% confidence)`);

    return result;
  } catch (error: any) {
    console.error(`[ContactEnrichment] Analysis failed for ${contactInput.name}:`, error.message);

    // Return empty enrichment on failure
    return {
      emailConfidence: 0,
      phoneConfidence: 0,
      linkedinConfidence: 0,
      additionalInfo: [],
      overallConfidence: 0
    };
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // US phone numbers should be 10 or 11 digits (with or without country code)
  return digits.length === 10 || digits.length === 11;
}

/**
 * Validate LinkedIn URL
 */
export function isValidLinkedInUrl(url: string): boolean {
  return url.includes('linkedin.com/in/') && url.startsWith('http');
}

/**
 * Score enrichment quality
 */
export function scoreEnrichment(enrichment: EnrichedContactData): number {
  let score = 0;

  // Email (40 points)
  if (enrichment.email && isValidEmail(enrichment.email)) {
    score += enrichment.emailConfidence * 0.4;
  }

  // Phone (30 points)
  if (enrichment.phone && isValidPhone(enrichment.phone)) {
    score += enrichment.phoneConfidence * 0.3;
  }

  // LinkedIn (30 points)
  if (enrichment.linkedinUrl && isValidLinkedInUrl(enrichment.linkedinUrl)) {
    score += enrichment.linkedinConfidence * 0.3;
  }

  return Math.round(score);
}
