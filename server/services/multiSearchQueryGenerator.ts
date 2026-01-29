/**
 * Multi-Search Query Generator
 * Generates 10-15 targeted search queries to mimic manual research process
 */

export interface SearchInput {
  businessName?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  website?: string;
}

export interface GeneratedQuery {
  query: string;
  purpose: string;
  priority: number; // 1 = highest priority
}

/**
 * Generate comprehensive search queries for business intelligence gathering
 */
export function generateSearchQueries(input: SearchInput): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const businessName = input.businessName || '';
  const phone = input.phone || '';
  const email = input.email || '';
  const location = input.city && input.state ? `${input.city} ${input.state}` : input.state || '';

  // Priority 1: Core business identification
  if (businessName) {
    queries.push(
      { query: `"${businessName}" real estate brokerage`, purpose: 'Identify business website and basic info', priority: 1 },
      { query: `${businessName} broker owner`, purpose: 'Find decision-makers', priority: 1 },
      { query: `${businessName} team agents`, purpose: 'Discover team structure', priority: 2 }
    );
  }

  if (phone) {
    queries.push(
      { query: `"${phone}" real estate`, purpose: 'Reverse phone lookup for business', priority: 1 },
      { query: `"${phone}" broker owner`, purpose: 'Find owner via phone', priority: 2 }
    );
  }

  if (email) {
    const domain = email.split('@')[1];
    if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail')) {
      queries.push(
        { query: `site:${domain}`, purpose: 'Find business website from email domain', priority: 1 },
        { query: `"${email}" real estate broker`, purpose: 'Find person associated with email', priority: 2 }
      );
    }
  }

  // Priority 2: Contact information deep dive
  if (businessName) {
    queries.push(
      { query: `${businessName} contact email phone`, purpose: 'Find direct contact details', priority: 2 },
      { query: `${businessName} site:linkedin.com`, purpose: 'Find LinkedIn company page', priority: 2 },
      { query: `${businessName} ${location} real estate`, purpose: 'Verify location and legitimacy', priority: 3 }
    );
  }

  // Priority 3: Intelligence gathering
  if (businessName) {
    queries.push(
      { query: `${businessName} reviews complaints`, purpose: 'Identify pain points from reviews', priority: 3 },
      { query: `${businessName} news press release`, purpose: 'Find recent news and achievements', priority: 3 },
      { query: `${businessName} MLS membership association`, purpose: 'Discover MLS and association memberships', priority: 3 },
      { query: `${businessName} CRM technology software`, purpose: 'Identify current technology stack', priority: 4 }
    );
  }

  // Priority 4: Decision-maker LinkedIn searches (will be added after finding names)
  // These are generated dynamically after initial searches

  // Sort by priority
  queries.sort((a, b) => a.priority - b.priority);

  return queries.slice(0, 15); // Limit to 15 queries
}

/**
 * Generate contact-specific search queries after finding names
 */
export function generateContactQueries(contactName: string, businessName: string): GeneratedQuery[] {
  return [
    { query: `"${contactName}" "${businessName}" site:linkedin.com`, purpose: 'Find LinkedIn profile', priority: 1 },
    { query: `"${contactName}" ${businessName} email`, purpose: 'Find email address', priority: 2 },
    { query: `"${contactName}" ${businessName} phone`, purpose: 'Find phone number', priority: 2 },
    { query: `"${contactName}" real estate broker ${businessName}`, purpose: 'Verify role and credentials', priority: 3 }
  ];
}
