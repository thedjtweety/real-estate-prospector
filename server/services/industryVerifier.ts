/**
 * Industry Verification Module
 * 
 * Verifies that a business is actually in the real estate industry
 * Uses Groq LLM (free) for intelligent classification
 */

import { invokeGroq } from './groqLLM';

export interface IndustryVerificationResult {
  isRealEstate: boolean;
  confidence: number;
  industry: string;
  reason: string;
}

/**
 * Verify if a business is in the real estate industry using Groq
 */
export async function verifyRealEstateIndustry(businessData: {
  name: string;
  website?: string;
  description?: string;
  snippet?: string;
}): Promise<IndustryVerificationResult> {
  try {
    console.log('[IndustryVerifier] Verifying industry for:', businessData.name);

    // Build context from available data
    const context = [
      `Business Name: ${businessData.name}`,
      businessData.website ? `Website: ${businessData.website}` : '',
      businessData.description ? `Description: ${businessData.description}` : '',
      businessData.snippet ? `Context: ${businessData.snippet}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `Analyze this business and determine if it is a real estate brokerage, agency, or real estate professional.

${context}

Real estate businesses include:
- Real estate brokerages
- Real estate agencies
- Individual real estate agents/realtors
- Property management companies (if they also do sales)
- Real estate investment firms

NOT real estate businesses:
- Mapping/navigation services (MapQuest, Google Maps)
- Real estate listing websites (Zillow, Realtor.com) - unless they are also brokerages
- Home improvement/construction companies
- Mortgage/lending companies (unless they also do real estate sales)
- Title/escrow companies

Respond in JSON format:
{
  "isRealEstate": true/false,
  "confidence": 0-100,
  "industry": "brief industry name",
  "reason": "one sentence explanation"
}`;

    const response = await invokeGroq({
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.1, // Low temperature for consistent classification
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    // Parse JSON response
    const result = JSON.parse(content);

    console.log('[IndustryVerifier] Result:', result);

    return {
      isRealEstate: result.isRealEstate || false,
      confidence: result.confidence || 0,
      industry: result.industry || 'Unknown',
      reason: result.reason || 'No reason provided',
    };

  } catch (error: any) {
    console.error('[IndustryVerifier] Verification failed:', error.message);
    
    // Fallback: Use keyword matching if Groq fails
    return fallbackKeywordVerification(businessData);
  }
}

/**
 * Fallback verification using keyword matching (if Groq fails)
 */
function fallbackKeywordVerification(businessData: {
  name: string;
  website?: string;
  description?: string;
  snippet?: string;
}): IndustryVerificationResult {
  const allText = [
    businessData.name,
    businessData.website,
    businessData.description,
    businessData.snippet,
  ].filter(Boolean).join(' ').toLowerCase();

  // Real estate keywords
  const realEstateKeywords = [
    'real estate', 'realty', 'realtor', 'broker', 'brokerage',
    'properties', 'homes', 'housing', 'mls', 'agent',
  ];

  // Non-real estate keywords (higher priority)
  const excludeKeywords = [
    'mapquest', 'google maps', 'zillow', 'realtor.com', 'trulia',
    'mortgage', 'loan', 'title', 'escrow', 'construction',
    'mapping', 'navigation', 'directions',
  ];

  // Check exclude keywords first
  for (const keyword of excludeKeywords) {
    if (allText.includes(keyword)) {
      return {
        isRealEstate: false,
        confidence: 80,
        industry: 'Not Real Estate',
        reason: `Business appears to be related to ${keyword}`,
      };
    }
  }

  // Check real estate keywords
  let matchCount = 0;
  for (const keyword of realEstateKeywords) {
    if (allText.includes(keyword)) {
      matchCount++;
    }
  }

  const isRealEstate = matchCount >= 2;
  const confidence = Math.min(matchCount * 25, 90); // Max 90% confidence for keyword matching

  return {
    isRealEstate,
    confidence,
    industry: isRealEstate ? 'Real Estate' : 'Unknown',
    reason: isRealEstate
      ? `Found ${matchCount} real estate keywords`
      : 'No clear real estate indicators found',
  };
}

/**
 * Quick check if business name suggests non-real-estate industry
 */
export function isObviouslyNotRealEstate(businessName: string): boolean {
  const lower = businessName.toLowerCase();
  
  const obviousNonRealEstate = [
    'mapquest',
    'google',
    'zillow',
    'trulia',
    'realtor.com',
    'redfin', // Listing site, not brokerage
    'apartments.com',
    'rent.com',
  ];

  return obviousNonRealEstate.some(keyword => lower.includes(keyword));
}
