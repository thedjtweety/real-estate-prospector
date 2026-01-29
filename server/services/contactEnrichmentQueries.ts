/**
 * Contact-Specific Enrichment Query Generator
 * Generates targeted searches to find direct contact information for each person
 */

import { GeneratedQuery } from './multiSearchQueryGenerator';

export interface ContactEnrichmentInput {
  name: string;
  title?: string;
  company?: string;
  city?: string;
  state?: string;
  existingEmail?: string;
  existingPhone?: string;
  existingLinkedIn?: string;
}

/**
 * Generate 3-5 targeted searches to enrich a specific contact's information
 */
export function generateContactEnrichmentQueries(input: ContactEnrichmentInput): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const name = input.name;
  const company = input.company || '';
  const location = input.city && input.state ? `${input.city} ${input.state}` : input.state || '';

  // Priority 1: LinkedIn profile (if not already found)
  if (!input.existingLinkedIn) {
    queries.push(
      { query: `"${name}" site:linkedin.com/in ${company}`, purpose: 'Find LinkedIn profile', priority: 1 },
      { query: `"${name}" linkedin ${company} ${location}`, purpose: 'Find LinkedIn profile alternate', priority: 2 }
    );
  }

  // Priority 2: Direct email (if not already found)
  if (!input.existingEmail) {
    queries.push(
      { query: `"${name}" email ${company} ${location}`, purpose: 'Find direct email', priority: 1 },
      { query: `"${name}" contact ${company} site:${extractDomain(company)}`, purpose: 'Find email on company site', priority: 2 }
    );
    
    // Try common email patterns
    if (company) {
      const domain = extractDomain(company);
      if (domain) {
        queries.push(
          { query: `"${name}" "@${domain}"`, purpose: 'Find email with domain', priority: 2 }
        );
      }
    }
  }

  // Priority 3: Mobile/direct phone (if not already found)
  if (!input.existingPhone) {
    queries.push(
      { query: `"${name}" phone ${company} ${location}`, purpose: 'Find direct phone', priority: 2 },
      { query: `"${name}" mobile ${company}`, purpose: 'Find mobile number', priority: 3 }
    );
  }

  // Priority 4: Professional profiles and directories
  queries.push(
    { query: `"${name}" ${company} realtor.com`, purpose: 'Find realtor.com profile', priority: 3 },
    { query: `"${name}" ${company} zillow`, purpose: 'Find Zillow profile', priority: 3 }
  );

  // Sort by priority and limit to 5 queries
  queries.sort((a, b) => a.priority - b.priority);
  return queries.slice(0, 5);
}

/**
 * Extract domain from company name or URL
 */
function extractDomain(company: string): string | null {
  if (!company) return null;
  
  // If it looks like a URL
  if (company.includes('.')) {
    try {
      const url = company.startsWith('http') ? company : `https://${company}`;
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      // Not a valid URL
    }
  }
  
  // Try to guess domain from company name
  const normalized = company.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/realty|realtor|real\s*estate|properties|group|inc|llc|corp/gi, '');
  
  if (normalized.length > 3) {
    return `${normalized}.com`;
  }
  
  return null;
}

/**
 * Generate email pattern guesses based on name and company
 */
export function generateEmailPatterns(firstName: string, lastName: string, domain: string): string[] {
  const f = firstName.toLowerCase();
  const l = lastName.toLowerCase();
  const fi = f[0];
  
  return [
    `${f}.${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${fi}${l}@${domain}`,
    `${l}${f}@${domain}`,
    `${f}_${l}@${domain}`,
    `${f}@${domain}`,
  ];
}
