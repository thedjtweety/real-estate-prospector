/**
 * Decision-Maker Intelligence Service
 * 
 * Identifies key decision-makers, scores contacts, and provides
 * "foot in the door" intelligence for effective prospecting.
 */

export interface ContactIntelligence {
  contactId?: number;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  
  // Decision-maker scoring
  decisionMakerScore: number; // 0-100
  isPrimaryContact: boolean;
  approachOrder: number; // 1 = contact first, 2 = second, etc.
  isGatekeeper: boolean;
  
  // Role intelligence
  detectedRole: 'broker' | 'owner' | 'office_manager' | 'transaction_coordinator' | 'agent' | 'assistant' | 'unknown';
  roleConfidence: number;
  seniorityLevel: 'executive' | 'management' | 'staff' | 'unknown';
  
  // Authority & influence
  decisionAuthority: 'signer' | 'influencer' | 'user' | 'unknown';
  narDesignations: string[]; // CRS, GRI, ABR, etc.
  associationRoles: string[]; // Board president, committee member, etc.
  influenceScore: number; // 0-100
  
  // Contact intelligence
  linkedInUrl?: string;
  linkedInConnections?: number;
  yearsInRole?: number;
  bestContactMethod: 'email' | 'phone' | 'linkedin' | 'unknown';
  
  // Foot-in-the-door intel
  warmIntroPath?: string;
  recentAchievements: string[];
  painPoints: string[];
  technologyStack: string[];
}

export interface OrganizationalHierarchy {
  broker?: ContactIntelligence;
  officeManager?: ContactIntelligence;
  transactionCoordinators: ContactIntelligence[];
  assistants: ContactIntelligence[];
  agents: ContactIntelligence[];
}

/**
 * Analyze contact role from multiple signals
 */
export function analyzeContactRole(params: {
  name: string;
  title?: string;
  email?: string;
  linkedInTitle?: string;
  bio?: string;
}): {
  role: ContactIntelligence['detectedRole'];
  confidence: number;
  seniorityLevel: ContactIntelligence['seniorityLevel'];
} {
  const { title, email, linkedInTitle, bio } = params;
  const allText = [title, email, linkedInTitle, bio].filter(Boolean).join(' ').toLowerCase();
  
  // Role detection patterns
  const patterns = {
    broker: /\b(broker|managing broker|designated broker|principal broker)\b/i,
    owner: /\b(owner|co-owner|founder|ceo|president|principal)\b/i,
    office_manager: /\b(office manager|operations manager|admin manager)\b/i,
    transaction_coordinator: /\b(transaction coordinator|tc|transaction manager)\b/i,
    agent: /\b(agent|realtor|sales associate|real estate professional)\b/i,
    assistant: /\b(assistant|admin|administrative|support)\b/i,
  };
  
  // Check patterns
  for (const [role, pattern] of Object.entries(patterns)) {
    if (pattern.test(allText)) {
      const confidence = title && pattern.test(title) ? 95 : 75;
      const seniorityLevel = ['broker', 'owner'].includes(role) ? 'executive' :
                            ['office_manager'].includes(role) ? 'management' : 'staff';
      return {
        role: role as ContactIntelligence['detectedRole'],
        confidence,
        seniorityLevel,
      };
    }
  }
  
  // Email pattern analysis
  if (email) {
    const emailPrefix = email.split('@')[0]?.toLowerCase() || '';
    if (/^(broker|owner|ceo|president)/.test(emailPrefix)) {
      return { role: 'broker', confidence: 80, seniorityLevel: 'executive' };
    }
    if (/^(admin|office|manager)/.test(emailPrefix)) {
      return { role: 'office_manager', confidence: 75, seniorityLevel: 'management' };
    }
    if (/^(tc|transaction)/.test(emailPrefix)) {
      return { role: 'transaction_coordinator', confidence: 75, seniorityLevel: 'staff' };
    }
  }
  
  return { role: 'unknown', confidence: 0, seniorityLevel: 'unknown' };
}

/**
 * Calculate decision-maker score
 */
export function calculateDecisionMakerScore(contact: {
  role: ContactIntelligence['detectedRole'];
  seniorityLevel: ContactIntelligence['seniorityLevel'];
  narDesignations: string[];
  linkedInConnections?: number;
  yearsInRole?: number;
  associationRoles: string[];
}): number {
  let score = 0;
  
  // Role-based scoring (40 points)
  const roleScores: Record<string, number> = {
    broker: 40,
    owner: 40,
    office_manager: 25,
    transaction_coordinator: 15,
    agent: 10,
    assistant: 5,
    unknown: 0,
  };
  score += roleScores[contact.role] || 0;
  
  // Seniority (20 points)
  const seniorityScores: Record<string, number> = {
    executive: 20,
    management: 12,
    staff: 5,
    unknown: 0,
  };
  score += seniorityScores[contact.seniorityLevel] || 0;
  
  // NAR designations (15 points)
  score += Math.min(contact.narDesignations.length * 5, 15);
  
  // LinkedIn connections (10 points)
  if (contact.linkedInConnections) {
    if (contact.linkedInConnections > 500) score += 10;
    else if (contact.linkedInConnections > 200) score += 7;
    else if (contact.linkedInConnections > 100) score += 4;
  }
  
  // Years in role (10 points)
  if (contact.yearsInRole) {
    if (contact.yearsInRole > 10) score += 10;
    else if (contact.yearsInRole > 5) score += 7;
    else if (contact.yearsInRole > 2) score += 4;
  }
  
  // Association leadership (5 points)
  score += Math.min(contact.associationRoles.length * 5, 5);
  
  return Math.min(score, 100);
}

/**
 * Determine decision authority
 */
export function determineDecisionAuthority(
  role: ContactIntelligence['detectedRole'],
  seniorityLevel: ContactIntelligence['seniorityLevel']
): ContactIntelligence['decisionAuthority'] {
  if (role === 'broker' || role === 'owner') return 'signer';
  if (role === 'office_manager') return 'influencer';
  if (seniorityLevel === 'executive') return 'signer';
  if (seniorityLevel === 'management') return 'influencer';
  return 'user';
}

/**
 * Detect NAR designations from text
 */
export function detectNARDesignations(text: string): string[] {
  const designations = [
    'CRS', 'GRI', 'ABR', 'SRES', 'CIPS', 'GREEN', 'AHWD',
    'C2EX', 'RSPS', 'SFR', 'PSA', 'MRP', 'RENE', 'RAA'
  ];
  
  const found: string[] = [];
  const upperText = text.toUpperCase();
  
  for (const designation of designations) {
    const pattern = new RegExp(`\\b${designation}\\b`);
    if (pattern.test(upperText)) {
      found.push(designation);
    }
  }
  
  return found;
}

/**
 * Build organizational hierarchy from contacts
 */
export function buildOrganizationalHierarchy(
  contacts: ContactIntelligence[]
): OrganizationalHierarchy {
  const hierarchy: OrganizationalHierarchy = {
    transactionCoordinators: [],
    assistants: [],
    agents: [],
  };
  
  for (const contact of contacts) {
    switch (contact.detectedRole) {
      case 'broker':
      case 'owner':
        if (!hierarchy.broker || contact.decisionMakerScore > hierarchy.broker.decisionMakerScore) {
          hierarchy.broker = contact;
        }
        break;
      case 'office_manager':
        if (!hierarchy.officeManager || contact.decisionMakerScore > hierarchy.officeManager.decisionMakerScore) {
          hierarchy.officeManager = contact;
        }
        break;
      case 'transaction_coordinator':
        hierarchy.transactionCoordinators.push(contact);
        break;
      case 'assistant':
        hierarchy.assistants.push(contact);
        break;
      case 'agent':
        hierarchy.agents.push(contact);
        break;
    }
  }
  
  // Sort by decision-maker score
  hierarchy.transactionCoordinators.sort((a, b) => b.decisionMakerScore - a.decisionMakerScore);
  hierarchy.assistants.sort((a, b) => b.decisionMakerScore - a.decisionMakerScore);
  hierarchy.agents.sort((a, b) => b.decisionMakerScore - a.decisionMakerScore);
  
  return hierarchy;
}

/**
 * Determine approach order for contacts
 */
export function determineApproachOrder(contacts: ContactIntelligence[]): ContactIntelligence[] {
  // Sort by decision-maker score
  const sorted = [...contacts].sort((a, b) => b.decisionMakerScore - a.decisionMakerScore);
  
  // Assign approach order
  sorted.forEach((contact, index) => {
    contact.approachOrder = index + 1;
    contact.isPrimaryContact = index === 0;
  });
  
  return sorted;
}

/**
 * Detect technology stack from website text
 */
export function detectTechnologyStack(websiteText: string): string[] {
  const techPatterns: Record<string, RegExp> = {
    'Salesforce': /salesforce/i,
    'HubSpot': /hubspot/i,
    'Zillow': /zillow/i,
    'Realtor.com': /realtor\.com/i,
    'dotloop': /dotloop/i,
    'DocuSign': /docusign/i,
    'SkySlope': /skyslope/i,
    'BoomTown': /boomtown/i,
    'Follow Up Boss': /follow\s*up\s*boss/i,
    'kvCORE': /kvcore/i,
    'Chime': /chime/i,
    'Contactually': /contactually/i,
  };
  
  const detected: string[] = [];
  for (const [tech, pattern] of Object.entries(techPatterns)) {
    if (pattern.test(websiteText)) {
      detected.push(tech);
    }
  }
  
  return detected;
}

/**
 * Recommend best contact method
 */
export function recommendContactMethod(contact: {
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  role: ContactIntelligence['detectedRole'];
}): ContactIntelligence['bestContactMethod'] {
  // Executives prefer LinkedIn or email
  if (contact.role === 'broker' || contact.role === 'owner') {
    if (contact.linkedInUrl) return 'linkedin';
    if (contact.email) return 'email';
  }
  
  // Office managers prefer email or phone
  if (contact.role === 'office_manager') {
    if (contact.email) return 'email';
    if (contact.phone) return 'phone';
  }
  
  // Default: email if available, otherwise phone
  if (contact.email) return 'email';
  if (contact.phone) return 'phone';
  if (contact.linkedInUrl) return 'linkedin';
  
  return 'unknown';
}
