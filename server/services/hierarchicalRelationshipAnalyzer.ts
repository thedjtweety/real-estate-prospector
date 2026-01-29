/**
 * Hierarchical Relationship Analyzer
 * Analyzes search results to extract Agent → Team → Brokerage relationships
 */

import { invokeGroq } from './groqLLM';
import { SearchResult } from './parallelSearchExecutor';

export interface HierarchicalRelationship {
  agent: {
    name: string;
    title?: string;
    role?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    confidence: number;
  };
  team?: {
    name: string;
    role?: string; // team leader, team member, etc.
    confidence: number;
  };
  brokerage: {
    name: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    confidence: number;
  };
  possiblyRelated: Array<{
    type: 'team' | 'brokerage' | 'contact';
    name: string;
    details: string;
    confidence: number;
  }>;
  overallConfidence: number;
}

/**
 * Analyze search results to extract hierarchical relationships
 */
export async function analyzeHierarchicalRelationship(
  searchResults: SearchResult[],
  agentInput: { name: string; phone?: string; email?: string }
): Promise<HierarchicalRelationship> {
  console.log('[HierarchyAnalyzer] Analyzing relationships for agent:', agentInput.name);

  // Prepare context from all search results
  const context = searchResults
    .map(sr => {
      const resultsText = sr.results
        .map(r => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description}`)
        .join('\n\n');
      return `Search: "${sr.query}"\nResults:\n${resultsText}`;
    })
    .join('\n\n---\n\n');

  const prompt = `You are analyzing search results to find the hierarchical relationship for a real estate agent.

Agent Being Searched:
- Name: ${agentInput.name}
- Phone: ${agentInput.phone || 'Unknown'}
- Email: ${agentInput.email || 'Unknown'}

Search Results:
${context.slice(0, 15000)}

Extract the hierarchical relationship in JSON format:
{
  "agent": {
    "name": "${agentInput.name}",
    "title": "Job title (e.g., 'Real Estate Agent', 'Realtor', 'Team Leader')",
    "role": "agent|team_leader|broker|unknown",
    "email": "Email if found",
    "phone": "Phone if found",
    "linkedinUrl": "LinkedIn URL if found",
    "confidence": 0-100
  },
  "team": {
    "name": "Team name if agent is part of a team (e.g., 'The Smith Team')",
    "role": "team_leader|team_member|unknown",
    "confidence": 0-100
  },
  "brokerage": {
    "name": "Brokerage name (e.g., 'Keller Williams Realty', 'RE/MAX')",
    "phone": "Brokerage phone",
    "email": "Brokerage email",
    "website": "Brokerage website",
    "address": "Brokerage address",
    "confidence": 0-100
  },
  "possiblyRelated": [
    {
      "type": "team|brokerage|contact",
      "name": "Name of possibly related entity",
      "details": "Why this might be related",
      "confidence": 0-100
    }
  ],
  "overallConfidence": 0-100
}

Important:
- The agent is ${agentInput.name} - find their employer (brokerage)
- If they're part of a team, include team name and their role
- Include "possiblyRelated" for uncertain but potentially useful information
- Confidence should reflect how certain you are
- Leave fields null if not found (don't make up data)`;

  try {
    const response = await invokeGroq({
      messages: [
        { role: 'system', content: 'You are an expert at analyzing real estate organizational structures. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content) as HierarchicalRelationship;

    console.log(`[HierarchyAnalyzer] Found brokerage: ${result.brokerage.name} (${result.brokerage.confidence}% confidence)`);
    if (result.team) {
      console.log(`[HierarchyAnalyzer] Found team: ${result.team.name} (${result.team.confidence}% confidence)`);
    }
    console.log(`[HierarchyAnalyzer] Possibly related items: ${result.possiblyRelated?.length || 0}`);

    return result;
  } catch (error: any) {
    console.error('[HierarchyAnalyzer] Analysis failed:', error.message);

    // Return minimal structure on failure
    return {
      agent: {
        name: agentInput.name,
        phone: agentInput.phone,
        email: agentInput.email,
        confidence: 50
      },
      brokerage: {
        name: 'Unknown',
        confidence: 0
      },
      possiblyRelated: [],
      overallConfidence: 0
    };
  }
}

/**
 * Validate and score a hierarchical relationship
 */
export function scoreHierarchicalRelationship(relationship: HierarchicalRelationship): number {
  let score = 0;

  // Agent data (30 points)
  if (relationship.agent.email) score += 10;
  if (relationship.agent.phone) score += 10;
  if (relationship.agent.linkedinUrl) score += 10;

  // Brokerage data (40 points)
  if (relationship.brokerage.name && relationship.brokerage.name !== 'Unknown') score += 20;
  if (relationship.brokerage.website) score += 10;
  if (relationship.brokerage.phone) score += 5;
  if (relationship.brokerage.email) score += 5;

  // Team data (20 points)
  if (relationship.team?.name) score += 20;

  // Confidence boost (10 points)
  if (relationship.overallConfidence >= 80) score += 10;
  else if (relationship.overallConfidence >= 60) score += 5;

  return Math.min(score, 100);
}
