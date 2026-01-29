/**
 * Cross-Reference Validator
 * Validates data accuracy by cross-referencing multiple sources
 */

import { AnalyzedIntelligence } from './intelligentResultAnalyzer';
import { SearchResult } from './parallelSearchExecutor';

export interface ValidationResult {
  field: string;
  value: string;
  confidence: number;
  sources: number;
  verified: boolean;
}

export interface CrossReferencedData {
  businessName: ValidationResult;
  website: ValidationResult;
  phone: ValidationResult;
  email: ValidationResult;
  address: ValidationResult;
  decisionMakers: Array<{
    name: string;
    title: string;
    role: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    confidence: number;
    sourcesFound: number;
  }>;
  technologyStack: string[];
  painPoints: string[];
  mlsMemberships: string[];
  associations: string[];
  recentNews: string[];
  overallConfidence: number;
}

/**
 * Cross-reference analyzed data against search results to verify accuracy
 */
export function crossReferenceData(
  analyzed: AnalyzedIntelligence,
  searchResults: SearchResult[]
): CrossReferencedData {
  console.log('[CrossReference] Validating data across multiple sources...');

  // Combine all search result text for cross-referencing
  const allText = searchResults
    .flatMap(sr => sr.results.map(r => `${r.title} ${r.description} ${r.url}`.toLowerCase()))
    .join(' ');

  // Validate business name
  const businessName = validateField(analyzed.businessName || '', allText, searchResults);
  
  // Validate website
  const website = validateField(analyzed.website || '', allText, searchResults);
  
  // Validate phone
  const phone = validateField(analyzed.phone || '', allText, searchResults);
  
  // Validate email
  const email = validateField(analyzed.email || '', allText, searchResults);
  
  // Validate address
  const address = validateField(analyzed.address || '', allText, searchResults);

  // Validate decision-makers with more detail
  const decisionMakers = analyzed.decisionMakers.map(dm => {
    const nameOccurrences = countOccurrences(dm.name.toLowerCase(), allText);
    const titleOccurrences = countOccurrences(dm.title.toLowerCase(), allText);
    const sourcesFound = Math.min(nameOccurrences + titleOccurrences, 10);
    
    // Boost confidence if found in multiple sources
    const adjustedConfidence = Math.min(
      dm.confidence + (sourcesFound * 5),
      100
    );

    return {
      ...dm,
      confidence: adjustedConfidence,
      sourcesFound
    };
  });

  // Sort decision-makers by confidence
  decisionMakers.sort((a, b) => b.confidence - a.confidence);

  // Calculate overall confidence
  const validationScores = [
    businessName.confidence,
    website.confidence,
    phone.confidence,
    email.confidence,
    ...decisionMakers.map(dm => dm.confidence)
  ].filter(score => score > 0);

  const overallConfidence = validationScores.length > 0
    ? Math.round(validationScores.reduce((sum, score) => sum + score, 0) / validationScores.length)
    : 0;

  console.log(`[CrossReference] Validation complete. Overall confidence: ${overallConfidence}%`);
  console.log(`[CrossReference] Decision-makers validated: ${decisionMakers.length}`);

  return {
    businessName,
    website,
    phone,
    email,
    address,
    decisionMakers,
    technologyStack: analyzed.technologyStack,
    painPoints: analyzed.painPoints,
    mlsMemberships: analyzed.mlsMemberships,
    associations: analyzed.associations,
    recentNews: analyzed.recentNews,
    overallConfidence
  };
}

/**
 * Validate a single field by checking how many sources mention it
 */
function validateField(
  value: string,
  allText: string,
  searchResults: SearchResult[]
): ValidationResult {
  if (!value) {
    return {
      field: '',
      value: '',
      confidence: 0,
      sources: 0,
      verified: false
    };
  }

  const occurrences = countOccurrences(value.toLowerCase(), allText);
  const sources = Math.min(occurrences, 10); // Cap at 10 sources
  
  // Calculate confidence based on number of sources
  // 1 source = 30%, 2 sources = 50%, 3+ sources = 70%+
  let confidence = 0;
  if (sources === 1) confidence = 30;
  else if (sources === 2) confidence = 50;
  else if (sources >= 3) confidence = 70 + Math.min(sources - 3, 3) * 10; // Up to 100%

  const verified = sources >= 2; // Verified if found in 2+ sources

  return {
    field: value,
    value,
    confidence,
    sources,
    verified
  };
}

/**
 * Count how many times a value appears in text
 */
function countOccurrences(needle: string, haystack: string): number {
  if (!needle || !haystack) return 0;
  
  const regex = new RegExp(escapeRegex(needle), 'gi');
  const matches = haystack.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Deduplicate decision-makers by name similarity
 */
export function deduplicateContacts(
  contacts: Array<{
    name: string;
    title: string;
    role: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    confidence: number;
    sourcesFound: number;
  }>
): Array<{
  name: string;
  title: string;
  role: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidence: number;
  sourcesFound: number;
}> {
  const unique: typeof contacts = [];
  
  for (const contact of contacts) {
    const isDuplicate = unique.some(existing => {
      // Check if names are very similar (simple check)
      const name1 = contact.name.toLowerCase().replace(/[^a-z]/g, '');
      const name2 = existing.name.toLowerCase().replace(/[^a-z]/g, '');
      return name1 === name2 || name1.includes(name2) || name2.includes(name1);
    });

    if (!isDuplicate) {
      unique.push(contact);
    } else {
      // If duplicate, merge the data (keep higher confidence)
      const existingIndex = unique.findIndex(existing => {
        const name1 = contact.name.toLowerCase().replace(/[^a-z]/g, '');
        const name2 = existing.name.toLowerCase().replace(/[^a-z]/g, '');
        return name1 === name2 || name1.includes(name2) || name2.includes(name1);
      });

      if (existingIndex >= 0 && contact.confidence > unique[existingIndex].confidence) {
        unique[existingIndex] = {
          ...unique[existingIndex],
          ...contact,
          sourcesFound: unique[existingIndex].sourcesFound + contact.sourcesFound
        };
      }
    }
  }

  return unique;
}
