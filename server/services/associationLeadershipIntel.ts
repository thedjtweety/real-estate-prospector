/**
 * Association Leadership Intelligence Service
 * 
 * Identifies association leadership roles and calculates influence scores
 * based on involvement in MLS boards, state associations, and local boards.
 */

import axios from 'axios';

export interface AssociationRole {
  associationName: string;
  position: string;
  type: 'president' | 'vice_president' | 'board_member' | 'committee_chair' | 'member';
  startDate?: string;
  source: string;
  verified: boolean;
}

export interface InfluenceScore {
  overall: number; // 0-100
  associationInvolvement: number;
  leadershipPositions: number;
  industryRecognition: number;
  networkSize: number;
  breakdown: {
    roles: AssociationRole[];
    leadershipCount: number;
    associationCount: number;
  };
}

/**
 * Identify association leadership roles for contacts
 */
export async function identifyAssociationRoles(params: {
  contactName: string;
  businessName?: string;
  location?: string;
}): Promise<AssociationRole[]> {
  const { contactName, businessName, location } = params;
  
  console.log(`[AssociationLeadership] Identifying roles for ${contactName}`);
  
  const roles: AssociationRole[] = [];
  
  // Search for association leadership mentions
  const queries = [
    `"${contactName}" realtor association president board`,
    `"${contactName}" MLS board member`,
    `"${contactName}" real estate association leadership`,
  ];
  
  if (location) {
    queries.push(`"${contactName}" "${location}" realtor association`);
  }
  
  try {
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!forgeApiUrl || !forgeApiKey) {
      console.warn('[AssociationLeadership] Forge API not configured');
      return [];
    }
    
    const response = await axios.post(
      `${forgeApiUrl}/omni_search`,
      {
        queries,
        search_type: 'info',
      },
      {
        headers: {
          'Authorization': `Bearer ${forgeApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    
    const results = response.data?.results || [];
    
    // Extract roles from search results
    for (const result of results.slice(0, 10)) {
      const text = `${result.title} ${result.snippet || ''}`;
      const extractedRoles = extractRolesFromText(text, contactName);
      
      for (const role of extractedRoles) {
        roles.push({
          ...role,
          source: result.source || 'Web',
          verified: result.source?.includes('nar.realtor') || result.source?.includes('realtor.com'),
        });
      }
    }
    
    console.log(`[AssociationLeadership] Found ${roles.length} association roles`);
    return roles;
  } catch (error) {
    console.error('[AssociationLeadership] Role search failed:', error);
    return [];
  }
}

/**
 * Extract association roles from text
 */
function extractRolesFromText(text: string, contactName: string): Omit<AssociationRole, 'source' | 'verified'>[] {
  const roles: Omit<AssociationRole, 'source' | 'verified'>[] = [];
  
  // Position patterns
  const positionPatterns: Array<{
    type: AssociationRole['type'];
    patterns: RegExp[];
  }> = [
    {
      type: 'president',
      patterns: [
        /president\s+of\s+([^,\.]+(?:association|MLS|board))/i,
        /([^,\.]+(?:association|MLS|board))\s+president/i,
      ],
    },
    {
      type: 'vice_president',
      patterns: [
        /vice\s+president\s+of\s+([^,\.]+(?:association|MLS|board))/i,
        /([^,\.]+(?:association|MLS|board))\s+vice\s+president/i,
      ],
    },
    {
      type: 'board_member',
      patterns: [
        /board\s+member\s+(?:of|at)\s+([^,\.]+(?:association|MLS|board))/i,
        /([^,\.]+(?:association|MLS|board))\s+board\s+member/i,
        /serves?\s+on\s+(?:the\s+)?board\s+of\s+([^,\.]+(?:association|MLS|board))/i,
      ],
    },
    {
      type: 'committee_chair',
      patterns: [
        /chair(?:man|woman|person)?\s+of\s+([^,\.]+(?:committee|association|MLS))/i,
        /([^,\.]+(?:committee|association|MLS))\s+chair/i,
      ],
    },
  ];
  
  for (const { type, patterns } of positionPatterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        roles.push({
          associationName: match[1].trim(),
          position: type.replace('_', ' '),
          type,
        });
      }
    }
  }
  
  return roles;
}

/**
 * Calculate influence score based on association involvement
 */
export function calculateInfluenceScore(params: {
  associationRoles: AssociationRole[];
  narDesignations: string[];
  yearsInBusiness?: number;
}): InfluenceScore {
  const { associationRoles, narDesignations, yearsInBusiness } = params;
  
  let associationInvolvement = 0;
  let leadershipPositions = 0;
  let industryRecognition = 0;
  let networkSize = 0;
  
  // Score association involvement (0-40 points)
  const associationCount = associationRoles.length;
  associationInvolvement = Math.min(associationCount * 10, 40);
  
  // Score leadership positions (0-30 points)
  const leadershipCount = associationRoles.filter(r => 
    r.type === 'president' || r.type === 'vice_president' || r.type === 'committee_chair'
  ).length;
  
  leadershipPositions = leadershipCount * 10;
  if (associationRoles.some(r => r.type === 'president')) {
    leadershipPositions += 10; // Bonus for president role
  }
  leadershipPositions = Math.min(leadershipPositions, 30);
  
  // Score industry recognition (0-20 points)
  industryRecognition = Math.min(narDesignations.length * 5, 20);
  
  // Score network size (0-10 points) - estimated based on roles
  if (leadershipCount > 0) {
    networkSize = 10;
  } else if (associationCount > 2) {
    networkSize = 7;
  } else if (associationCount > 0) {
    networkSize = 4;
  }
  
  // Bonus for years in business
  if (yearsInBusiness && yearsInBusiness > 10) {
    industryRecognition = Math.min(industryRecognition + 5, 20);
  }
  
  const overall = Math.min(
    associationInvolvement + leadershipPositions + industryRecognition + networkSize,
    100
  );
  
  return {
    overall,
    associationInvolvement,
    leadershipPositions,
    industryRecognition,
    networkSize,
    breakdown: {
      roles: associationRoles,
      leadershipCount,
      associationCount,
    },
  };
}

/**
 * Identify networking opportunities based on association involvement
 */
export function identifyNetworkingOpportunities(params: {
  associationRoles: AssociationRole[];
  location?: string;
}): Array<{
  type: 'conference' | 'meeting' | 'event' | 'committee';
  name: string;
  association: string;
  timing: string;
  relevance: 'high' | 'medium' | 'low';
}> {
  const { associationRoles, location } = params;
  
  const opportunities: Array<{
    type: 'conference' | 'meeting' | 'event' | 'committee';
    name: string;
    association: string;
    timing: string;
    relevance: 'high' | 'medium' | 'low';
  }> = [];
  
  // If they're in leadership, they'll likely attend board meetings
  for (const role of associationRoles) {
    if (role.type === 'president' || role.type === 'vice_president' || role.type === 'board_member') {
      opportunities.push({
        type: 'meeting',
        name: 'Board Meeting',
        association: role.associationName,
        timing: 'Monthly',
        relevance: 'high',
      });
    }
    
    if (role.type === 'committee_chair') {
      opportunities.push({
        type: 'committee',
        name: 'Committee Meeting',
        association: role.associationName,
        timing: 'Quarterly',
        relevance: 'medium',
      });
    }
  }
  
  // Add generic opportunities based on location
  if (location) {
    opportunities.push({
      type: 'conference',
      name: 'State REALTOR® Conference',
      association: `${location} Association of REALTORS®`,
      timing: 'Annual',
      relevance: 'medium',
    });
  }
  
  return opportunities;
}
