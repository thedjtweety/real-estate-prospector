/**
 * Business Intelligence Analysis Module
 * 
 * Uses Groq (free) to analyze business data and extract:
 * - Technology stack (CRM, MLS, website platform)
 * - Pain points and challenges
 * - Company size and market position
 * - Recent news and updates
 */

import { invokeGroq } from './groqLLM';
import { searchBrave } from './braveSearchAPI';
import { searchDuckDuckGo } from './duckDuckGoScraper';

export interface BusinessIntelligence {
  technologyStack: {
    crm?: string;
    mls?: string[];
    website?: string;
    other?: string[];
  };
  painPoints: string[];
  marketPosition: {
    size: 'solo' | 'small' | 'medium' | 'large' | 'unknown';
    marketCoverage: string;
    competitivePosition: string;
  };
  recentNews: string[];
  summary: string;
}

/**
 * Search for business information using Brave and DuckDuckGo
 */
async function searchBusinessInfo(businessName: string, state?: string): Promise<string> {
  try {
    const queries = [
      `${businessName} real estate technology stack`,
      `${businessName} CRM MLS software`,
      `${businessName} real estate brokerage news`,
      state ? `${businessName} ${state} real estate` : null,
    ].filter(Boolean);

    let allResults = '';

    // Try Brave first
    try {
      if (queries[0]) {
        const braveResults = await searchBrave(queries[0]);
        allResults += braveResults
          .slice(0, 3)
          .map((r: any) => `${r.title}: ${r.snippet}`)
          .join('\n');
      }
    } catch (error) {
      console.log('[BusinessIntelligence] Brave search failed, trying DuckDuckGo');
    }

    // Fallback to DuckDuckGo
    if (!allResults && queries[0]) {
      const ddgResults = await searchDuckDuckGo(queries[0]);
      allResults += ddgResults
        .slice(0, 3)
        .map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n');
    }

    return allResults;
  } catch (error: any) {
    console.error('[BusinessIntelligence] Search failed:', error.message);
    return '';
  }
}

/**
 * Analyze business using Groq
 */
export async function analyzeBusinessIntelligence(businessData: {
  name: string;
  website?: string;
  description?: string;
  state?: string;
  contacts?: Array<{ name: string; title?: string }>;
}): Promise<BusinessIntelligence> {
  try {
    console.log('[BusinessIntelligence] Analyzing:', businessData.name);

    // Search for additional information
    const searchResults = await searchBusinessInfo(businessData.name, businessData.state);

    // Build context
    const context = [
      `Business Name: ${businessData.name}`,
      businessData.website ? `Website: ${businessData.website}` : '',
      businessData.state ? `State: ${businessData.state}` : '',
      businessData.description ? `Description: ${businessData.description}` : '',
      businessData.contacts?.length ? `Contacts: ${businessData.contacts.map(c => `${c.name} (${c.title})`).join(', ')}` : '',
      searchResults ? `\nRecent Information:\n${searchResults}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `Analyze this real estate brokerage and extract business intelligence:

${context}

Provide analysis in JSON format:
{
  "technologyStack": {
    "crm": "Salesforce/HubSpot/Follow Up Boss/etc or null",
    "mls": ["MLS name 1", "MLS name 2"],
    "website": "Website platform or null",
    "other": ["other software/tools"]
  },
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "marketPosition": {
    "size": "solo/small/medium/large/unknown",
    "marketCoverage": "geographic coverage description",
    "competitivePosition": "competitive analysis"
  },
  "recentNews": ["news item 1", "news item 2"],
  "summary": "one paragraph business summary"
}

Be specific and factual. If you don't have information, use null or empty arrays.`;

    const response = await invokeGroq({
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    // Parse JSON response
    const analysis = JSON.parse(content);

    console.log('[BusinessIntelligence] Analysis complete');

    return {
      technologyStack: analysis.technologyStack || {},
      painPoints: analysis.painPoints || [],
      marketPosition: analysis.marketPosition || {},
      recentNews: analysis.recentNews || [],
      summary: analysis.summary || '',
    };

  } catch (error: any) {
    console.error('[BusinessIntelligence] Analysis failed:', error.message);

    // Return empty intelligence on failure
    return {
      technologyStack: {},
      painPoints: [],
      marketPosition: {
        size: 'unknown',
        marketCoverage: 'Unknown',
        competitivePosition: 'Unknown',
      },
      recentNews: [],
      summary: 'Analysis unavailable',
    };
  }
}

/**
 * Format business intelligence for display
 */
export function formatBusinessIntelligence(intel: BusinessIntelligence): string {
  const parts: string[] = [];

  if (intel.summary) {
    parts.push(`**Summary:** ${intel.summary}`);
  }

  if (intel.technologyStack.crm || intel.technologyStack.mls?.length) {
    const tech: string[] = [];
    if (intel.technologyStack.crm) tech.push(`CRM: ${intel.technologyStack.crm}`);
    if (intel.technologyStack.mls?.length) tech.push(`MLS: ${intel.technologyStack.mls.join(', ')}`);
    if (intel.technologyStack.website) tech.push(`Website: ${intel.technologyStack.website}`);
    if (tech.length > 0) {
      parts.push(`**Technology:** ${tech.join(' | ')}`);
    }
  }

  if (intel.painPoints.length > 0) {
    parts.push(`**Pain Points:** ${intel.painPoints.join(', ')}`);
  }

  if (intel.marketPosition.size !== 'unknown') {
    parts.push(`**Market Position:** ${intel.marketPosition.size} brokerage - ${intel.marketPosition.marketCoverage}`);
  }

  if (intel.recentNews.length > 0) {
    parts.push(`**Recent News:** ${intel.recentNews.join('; ')}`);
  }

  return parts.join('\n');
}
