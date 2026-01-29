/**
 * Person vs Business Detector
 * Determines if search input is for an individual person or a business entity
 */

import { invokeGroq } from './groqLLM';

export interface DetectionResult {
  type: 'person' | 'business' | 'unknown';
  confidence: number;
  reasoning: string;
  suggestedSearchMode: 'agent_to_brokerage' | 'brokerage_to_agents';
}

/**
 * Detect if the input is a person name or business name
 */
export async function detectPersonVsBusiness(input: {
  name?: string;
  phone?: string;
  email?: string;
}): Promise<DetectionResult> {
  console.log('[PersonDetector] Analyzing input:', input);

  // Quick heuristics before using LLM
  if (input.name) {
    const name = input.name.toLowerCase();
    
    // Strong business indicators
    const businessKeywords = [
      'realty', 'real estate', 'properties', 'group', 'company', 'inc', 'llc',
      'corp', 'corporation', 'associates', 'partners', 'brokerage', 'homes',
      'keller williams', 're/max', 'coldwell banker', 'century 21', 'sotheby',
      'compass', 'exp realty', 'berkshire hathaway'
    ];
    
    if (businessKeywords.some(keyword => name.includes(keyword))) {
      return {
        type: 'business',
        confidence: 90,
        reasoning: 'Name contains business keywords',
        suggestedSearchMode: 'brokerage_to_agents'
      };
    }
    
    // Strong person indicators (First Last pattern with no business words)
    const words = name.trim().split(/\s+/);
    if (words.length === 2 && words[0][0] === words[0][0].toUpperCase() && words[1][0] === words[1][0].toUpperCase()) {
      // Looks like "John Smith" - probably a person
      return {
        type: 'person',
        confidence: 75,
        reasoning: 'Name follows First Last pattern',
        suggestedSearchMode: 'agent_to_brokerage'
      };
    }
  }

  // Use Groq for ambiguous cases
  try {
    const prompt = `Analyze this real estate search input and determine if it's for an INDIVIDUAL PERSON (agent/broker) or a BUSINESS ENTITY (brokerage/team).

Input:
- Name: ${input.name || 'Not provided'}
- Phone: ${input.phone || 'Not provided'}
- Email: ${input.email || 'Not provided'}

Respond in JSON format:
{
  "type": "person" or "business" or "unknown",
  "confidence": 0-100,
  "reasoning": "Brief explanation"
}

Examples:
- "John Smith" → person (individual name)
- "Keller Williams Realty" → business (company name)
- "The Smith Team" → business (team name, even though named after a person)
- "John Smith Real Estate" → business (person's name used as business)
- "RE/MAX Sundance" → business (franchise)`;

    const response = await invokeGroq({
      messages: [
        { role: 'system', content: 'You are an expert at distinguishing person names from business names in real estate. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content);

    const suggestedSearchMode = result.type === 'person' ? 'agent_to_brokerage' : 'brokerage_to_agents';

    console.log(`[PersonDetector] Detected: ${result.type} (${result.confidence}% confidence)`);

    return {
      type: result.type,
      confidence: result.confidence,
      reasoning: result.reasoning,
      suggestedSearchMode
    };
  } catch (error: any) {
    console.error('[PersonDetector] Detection failed:', error.message);
    
    // Default to business search if uncertain
    return {
      type: 'unknown',
      confidence: 50,
      reasoning: 'Unable to determine - defaulting to business search',
      suggestedSearchMode: 'brokerage_to_agents'
    };
  }
}
