/**
 * Decision-Maker Contact Enrichment Module
 * 
 * Uses Groq (free) to enrich contact information with:
 * - Email address discovery and pattern matching
 * - LinkedIn profile URLs
 * - Direct phone numbers
 * - Contact preference recommendations
 */

import { invokeGroq } from './groqLLM';
import { searchBrave } from './braveSearchAPI';
import { searchDuckDuckGo } from './duckDuckGoScraper';

export interface EnrichedContact {
  name: string;
  title?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  emailConfidence: number; // 0-100
  linkedinConfidence: number; // 0-100
  phoneConfidence: number; // 0-100
  preferredContact: 'email' | 'phone' | 'linkedin' | 'unknown';
  enrichmentSource: string[];
}

/**
 * Search for contact information online
 */
async function searchContactInfo(
  name: string,
  company: string,
  state?: string
): Promise<string> {
  try {
    const queries = [
      `${name} ${company} email contact`,
      `${name} ${company} LinkedIn`,
      `${name} ${company} phone number`,
    ];

    let allResults = '';

    // Try Brave first
    try {
      const braveResults = await searchBrave(queries[0]);
      allResults += braveResults
        .slice(0, 2)
        .map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n');
    } catch (error) {
      console.log('[ContactEnrichment] Brave search failed');
    }

    // Fallback to DuckDuckGo
    if (!allResults) {
      const ddgResults = await searchDuckDuckGo(queries[0]);
      allResults += ddgResults
        .slice(0, 2)
        .map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n');
    }

    return allResults;
  } catch (error: any) {
    console.error('[ContactEnrichment] Search failed:', error.message);
    return '';
  }
}

/**
 * Extract email patterns from company domain
 */
function generateEmailPatterns(name: string, domain: string): string[] {
  const patterns: string[] = [];
  const nameParts = name.toLowerCase().split(' ');

  if (nameParts.length >= 2) {
    const first = nameParts[0];
    const last = nameParts[nameParts.length - 1];

    // Common patterns
    patterns.push(`${first}.${last}@${domain}`);
    patterns.push(`${first}${last}@${domain}`);
    patterns.push(`${first}@${domain}`);
    patterns.push(`${last}@${domain}`);
    patterns.push(`${first}_${last}@${domain}`);
  }

  return patterns;
}

/**
 * Enrich a contact with additional information using Groq
 */
export async function enrichContact(contact: {
  name: string;
  title?: string;
  company: string;
  website?: string;
  state?: string;
}): Promise<EnrichedContact> {
  try {
    console.log('[ContactEnrichment] Enriching:', contact.name);

    // Search for additional information
    const searchResults = await searchContactInfo(contact.name, contact.company, contact.state);

    // Extract domain from website
    let domain = '';
    if (contact.website) {
      const match = contact.website.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
      domain = match?.[1] || '';
    }

    // Generate email patterns
    const emailPatterns = domain ? generateEmailPatterns(contact.name, domain) : [];

    // Build context for Groq
    const context = [
      `Name: ${contact.name}`,
      `Title: ${contact.title || 'Unknown'}`,
      `Company: ${contact.company}`,
      `Website: ${contact.website || 'Unknown'}`,
      `State: ${contact.state || 'Unknown'}`,
      emailPatterns.length > 0 ? `Possible emails: ${emailPatterns.join(', ')}` : '',
      searchResults ? `Search results:\n${searchResults}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `Enrich this real estate professional's contact information:

${context}

Provide enrichment in JSON format:
{
  "email": "most likely email address or null",
  "emailConfidence": 0-100,
  "linkedinUrl": "LinkedIn profile URL or null",
  "linkedinConfidence": 0-100,
  "phone": "direct phone number or null",
  "phoneConfidence": 0-100,
  "preferredContact": "email/phone/linkedin/unknown",
  "reasoning": "brief explanation of findings"
}

Be conservative with confidence scores. Only include information you're confident about.`;

    const response = await invokeGroq({
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    // Parse JSON response
    const enrichment = JSON.parse(content);

    console.log('[ContactEnrichment] Enrichment complete for:', contact.name);

    return {
      name: contact.name,
      title: contact.title,
      role: contact.title,
      email: enrichment.email,
      phone: enrichment.phone,
      linkedinUrl: enrichment.linkedinUrl,
      emailConfidence: enrichment.emailConfidence || 0,
      linkedinConfidence: enrichment.linkedinConfidence || 0,
      phoneConfidence: enrichment.phoneConfidence || 0,
      preferredContact: enrichment.preferredContact || 'unknown',
      enrichmentSource: ['Groq LLM', 'Email Pattern Matching', 'Web Search'],
    };

  } catch (error: any) {
    console.error('[ContactEnrichment] Enrichment failed:', error.message);

    // Return basic contact without enrichment
    return {
      name: contact.name,
      title: contact.title,
      role: contact.title,
      emailConfidence: 0,
      linkedinConfidence: 0,
      phoneConfidence: 0,
      preferredContact: 'unknown',
      enrichmentSource: ['Enrichment Failed'],
    };
  }
}

/**
 * Enrich multiple contacts in parallel
 */
export async function enrichContacts(
  contacts: Array<{
    name: string;
    title?: string;
    company: string;
    website?: string;
    state?: string;
  }>
): Promise<EnrichedContact[]> {
  console.log('[ContactEnrichment] Enriching', contacts.length, 'contacts');

  // Limit to 5 contacts at a time to avoid rate limits
  const enriched: EnrichedContact[] = [];

  for (let i = 0; i < Math.min(contacts.length, 5); i++) {
    const enrichedContact = await enrichContact(contacts[i]);
    enriched.push(enrichedContact);
  }

  return enriched;
}

/**
 * Format enriched contact for display
 */
export function formatEnrichedContact(contact: EnrichedContact): string {
  const parts: string[] = [];

  parts.push(`**${contact.name}**`);

  if (contact.title) {
    parts.push(`Title: ${contact.title}`);
  }

  if (contact.email && contact.emailConfidence >= 70) {
    parts.push(`📧 Email: ${contact.email} (${contact.emailConfidence}% confident)`);
  }

  if (contact.phone && contact.phoneConfidence >= 70) {
    parts.push(`📱 Phone: ${contact.phone} (${contact.phoneConfidence}% confident)`);
  }

  if (contact.linkedinUrl && contact.linkedinConfidence >= 70) {
    parts.push(`💼 LinkedIn: ${contact.linkedinUrl}`);
  }

  if (contact.preferredContact !== 'unknown') {
    parts.push(`Preferred contact: ${contact.preferredContact}`);
  }

  return parts.join('\n');
}
