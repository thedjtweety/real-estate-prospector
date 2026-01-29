/**
 * Intelligent Result Analyzer
 * Uses Groq to analyze search results and extract structured data
 */

import { invokeGroq } from './groqLLM';
import { SearchResult } from './parallelSearchExecutor';

export interface AnalyzedIntelligence {
  businessName?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  decisionMakers: Array<{
    name: string;
    title: string;
    role: 'owner' | 'broker' | 'manager' | 'agent' | 'tech_poc' | 'unknown';
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    confidence: number;
  }>;
  technologyStack: string[];
  painPoints: string[];
  mlsMemberships: string[];
  associations: string[];
  recentNews: string[];
  confidence: number;
}

/**
 * Analyze all search results using Groq to extract structured intelligence
 */
export async function analyzeSearchResults(
  searchResults: SearchResult[],
  originalInput: { businessName?: string; phone?: string; email?: string }
): Promise<AnalyzedIntelligence> {
  console.log('[IntelligentAnalyzer] Analyzing search results with Groq...');

  // Prepare context from all search results
  const context = searchResults
    .map(sr => {
      const resultsText = sr.results
        .map(r => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description}`)
        .join('\n\n');
      return `Search: "${sr.query}" (Purpose: ${sr.purpose})\nResults:\n${resultsText}`;
    })
    .join('\n\n---\n\n');

  const prompt = `You are an expert real estate intelligence analyst. Analyze the following search results and extract structured information about a real estate brokerage.

Original Input:
- Business Name: ${originalInput.businessName || 'Unknown'}
- Phone: ${originalInput.phone || 'Unknown'}
- Email: ${originalInput.email || 'Unknown'}

Search Results:
${context.slice(0, 15000)} // Limit context to avoid token limits

Extract the following information in JSON format:
{
  "businessName": "Full business name",
  "website": "Primary website URL",
  "phone": "Primary phone number",
  "email": "Primary email",
  "address": "Full address",
  "decisionMakers": [
    {
      "name": "Full name",
      "title": "Job title",
      "role": "owner|broker|manager|agent|tech_poc|unknown",
      "email": "Email if found",
      "phone": "Phone if found",
      "linkedinUrl": "LinkedIn profile URL if found",
      "confidence": 0-100
    }
  ],
  "technologyStack": ["CRM name", "MLS platform", "Website platform"],
  "painPoints": ["Pain point 1", "Pain point 2"],
  "mlsMemberships": ["MLS name 1", "MLS name 2"],
  "associations": ["Association name 1", "Association name 2"],
  "recentNews": ["News headline 1", "News headline 2"],
  "confidence": 0-100
}

Important:
- Only include information you find in the search results
- Prioritize finding the broker/owner and technology POC
- For decision-makers, assign role based on title (CEO/Owner = owner, Broker = broker, IT/Tech = tech_poc)
- Confidence should reflect how certain you are about the data
- Leave fields empty if not found`;

  try {
    const response = await invokeGroq({
      messages: [
        { role: 'system', content: 'You are a real estate intelligence analyst. Always respond with valid JSON only, no other text.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = response.choices[0].message.content;
    const analyzed = JSON.parse(content) as AnalyzedIntelligence;

    console.log(`[IntelligentAnalyzer] Extracted: ${analyzed.decisionMakers?.length || 0} decision-makers, confidence: ${analyzed.confidence}%`);
    
    return analyzed;
  } catch (error: any) {
    console.error('[IntelligentAnalyzer] Groq analysis failed:', error.message);
    
    // Return empty structure on failure
    return {
      decisionMakers: [],
      technologyStack: [],
      painPoints: [],
      mlsMemberships: [],
      associations: [],
      recentNews: [],
      confidence: 0
    };
  }
}

/**
 * Perform deep dive on specific contacts to find more details
 */
export async function analyzeContactDetails(
  contactName: string,
  businessName: string,
  searchResults: SearchResult[]
): Promise<{
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  additionalInfo: string;
  confidence: number;
}> {
  console.log(`[IntelligentAnalyzer] Deep dive on contact: ${contactName}`);

  const context = searchResults
    .map(sr => sr.results.map(r => `${r.title}\n${r.description}\n${r.url}`).join('\n'))
    .join('\n\n');

  const prompt = `Find contact details for "${contactName}" at "${businessName}" from these search results:

${context.slice(0, 10000)}

Extract in JSON format:
{
  "email": "email@domain.com or null",
  "phone": "(123) 456-7890 or null",
  "linkedinUrl": "https://linkedin.com/in/... or null",
  "additionalInfo": "Any other relevant info about this person",
  "confidence": 0-100
}`;

  try {
    const response = await invokeGroq({
      messages: [
        { role: 'system', content: 'You are a contact research specialist. Always respond with valid JSON only, no other text.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error: any) {
    console.error(`[IntelligentAnalyzer] Contact analysis failed for ${contactName}:`, error.message);
    return {
      additionalInfo: '',
      confidence: 0
    };
  }
}
