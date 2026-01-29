/**
 * Agent-to-Brokerage Search Query Generator
 * Generates targeted searches to find an agent's brokerage and team affiliation
 */

import { GeneratedQuery } from './multiSearchQueryGenerator';

export interface AgentSearchInput {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
}

/**
 * Generate search queries to find an agent's brokerage and team
 */
export function generateAgentToBrokerageQueries(input: AgentSearchInput): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const name = input.name;
  const location = input.city && input.state ? `${input.city} ${input.state}` : input.state || '';

  // Priority 1: Direct brokerage affiliation searches
  queries.push(
    { query: `"${name}" real estate agent brokerage ${location}`, purpose: 'Find agent brokerage affiliation', priority: 1 },
    { query: `"${name}" realtor works at ${location}`, purpose: 'Find employer', priority: 1 },
    { query: `"${name}" ${location} real estate company`, purpose: 'Find company affiliation', priority: 1 }
  );

  // Priority 2: Team detection
  queries.push(
    { query: `"${name}" team real estate ${location}`, purpose: 'Detect team membership', priority: 2 },
    { query: `"${name}" realtor team leader ${location}`, purpose: 'Check if team leader', priority: 2 }
  );

  // Priority 3: LinkedIn and profile searches
  queries.push(
    { query: `"${name}" site:linkedin.com real estate ${location}`, purpose: 'Find LinkedIn profile with employer', priority: 2 },
    { query: `"${name}" realtor.com profile ${location}`, purpose: 'Find realtor.com profile', priority: 3 },
    { query: `"${name}" zillow profile ${location}`, purpose: 'Find Zillow profile', priority: 3 }
  );

  // Priority 4: Phone-based searches if available
  if (input.phone) {
    const digits = input.phone.replace(/\D/g, '');
    const formatted1 = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    const formatted2 = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    
    queries.push(
      { query: `"${formatted1}" "${name}" real estate`, purpose: 'Find brokerage via phone', priority: 2 },
      { query: `"${formatted2}" "${name}" brokerage`, purpose: 'Find brokerage via phone alternate format', priority: 3 }
    );
  }

  // Priority 5: Email domain search if available
  if (input.email) {
    const domain = input.email.split('@')[1];
    if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail')) {
      queries.push(
        { query: `site:${domain} about team`, purpose: 'Find brokerage website from email domain', priority: 2 },
        { query: `"${domain}" real estate brokerage`, purpose: 'Identify brokerage from domain', priority: 3 }
      );
    }
  }

  // Priority 6: License and association lookups
  queries.push(
    { query: `"${name}" real estate license ${input.state || ''}`, purpose: 'Find license information with brokerage', priority: 3 },
    { query: `"${name}" NAR member ${location}`, purpose: 'Find NAR directory listing', priority: 4 }
  );

  // Sort by priority and limit to 15 queries
  queries.sort((a, b) => a.priority - b.priority);
  return queries.slice(0, 15);
}

/**
 * Generate queries to find team details (when we know the team name)
 */
export function generateTeamDetailsQueries(teamName: string, location?: string): GeneratedQuery[] {
  return [
    { query: `"${teamName}" real estate brokerage ${location || ''}`, purpose: 'Find team brokerage affiliation', priority: 1 },
    { query: `"${teamName}" team members ${location || ''}`, purpose: 'Find team members', priority: 2 },
    { query: `"${teamName}" site:linkedin.com`, purpose: 'Find team LinkedIn page', priority: 2 },
    { query: `"${teamName}" contact information ${location || ''}`, purpose: 'Find team contact details', priority: 3 }
  ];
}
