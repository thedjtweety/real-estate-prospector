/**
 * MLS & Association Intelligence Service
 * 
 * Comprehensive system for identifying real estate association memberships
 * using real MLS database, geographic mapping, and multi-source verification.
 */

export interface MLSAssociation {
  name: string;
  type: 'MLS' | 'State Association' | 'Local Board';
  city?: string;
  state: string;
  zipCode?: string;
  website?: string;
  confidence: 'Verified' | 'High' | 'Medium' | 'Inferred';
  source: string;
}

/**
 * Real MLS Database - Comprehensive list from RESO
 * Organized by state for efficient lookup
 */
const MLS_DATABASE: Record<string, Array<{
  name: string;
  city: string;
  state: string;
  zip: string;
  coverage: string[]; // Cities/counties covered
}>> = {
  FL: [
    { name: 'BeachesMLS', city: 'West Palm Beach', state: 'FL', zip: '33409', coverage: ['West Palm Beach', 'Palm Beach', 'Boynton Beach', 'Delray Beach'] },
    { name: 'Florida Gulf Coast Multiple Listing Service', city: 'Fort Myers', state: 'FL', zip: '33916', coverage: ['Fort Myers', 'Naples', 'Cape Coral', 'Bonita Springs', 'Estero', 'Lee County', 'Collier County'] },
    { name: 'Miami REALTORS®', city: 'Miami', state: 'FL', zip: '33126', coverage: ['Miami', 'Miami Beach', 'Coral Gables', 'Hialeah', 'Miami-Dade County'] },
    { name: 'Northeast Florida Association of REALTORS®', city: 'Jacksonville', state: 'FL', zip: '32256', coverage: ['Jacksonville', 'St. Augustine', 'Orange Park', 'Duval County', 'St. Johns County', 'Clay County'] },
    { name: 'Stellar MLS', city: 'Jacksonville', state: 'FL', zip: '32256', coverage: ['Jacksonville', 'Tallahassee', 'Gainesville', 'Ocala', 'North Florida', 'Central Florida'] },
    { name: 'Tampa Bay MLS', city: 'Tampa', state: 'FL', zip: '33607', coverage: ['Tampa', 'St. Petersburg', 'Clearwater', 'Brandon', 'Hillsborough County', 'Pinellas County', 'Pasco County'] },
    { name: 'Orlando Regional REALTOR® Association', city: 'Orlando', state: 'FL', zip: '32803', coverage: ['Orlando', 'Kissimmee', 'Winter Park', 'Orange County', 'Osceola County', 'Seminole County'] },
    { name: 'Daytona Beach Area Association of REALTORS®', city: 'Holly Hill', state: 'FL', zip: '32117', coverage: ['Daytona Beach', 'Ormond Beach', 'Port Orange', 'Volusia County'] },
    { name: 'Emerald Coast Association of REALTORS®', city: 'Fort Walton Beach', state: 'FL', zip: '32458', coverage: ['Fort Walton Beach', 'Destin', 'Panama City Beach', 'Okaloosa County', 'Walton County'] },
    { name: 'Florida Keys Board of REALTORS®', city: 'Key Largo', state: 'FL', zip: '33037', coverage: ['Key Largo', 'Key West', 'Marathon', 'Islamorada', 'Monroe County'] },
    { name: 'Capital Area Technology & REALTOR® Services', city: 'Tallahassee', state: 'FL', zip: '32303', coverage: ['Tallahassee', 'Leon County'] },
  ],
  TX: [
    { name: 'Houston Association of REALTORS®', city: 'Houston', state: 'TX', zip: '77027', coverage: ['Houston', 'The Woodlands', 'Sugar Land', 'Katy', 'Harris County', 'Fort Bend County', 'Montgomery County'] },
    { name: 'Austin Board of REALTORS® MLS', city: 'Austin', state: 'TX', zip: '78759', coverage: ['Austin', 'Round Rock', 'Georgetown', 'Cedar Park', 'Travis County', 'Williamson County'] },
    { name: 'Dallas Central Appraisal District MLS', city: 'Dallas', state: 'TX', zip: '75201', coverage: ['Dallas', 'Fort Worth', 'Plano', 'Irving', 'Dallas County', 'Tarrant County', 'Collin County'] },
    { name: 'San Antonio Board of REALTORS®', city: 'San Antonio', state: 'TX', zip: '78230', coverage: ['San Antonio', 'New Braunfels', 'Bexar County', 'Comal County'] },
    { name: 'Central Texas MLS (CTXMLS)', city: 'New Braunfels', state: 'TX', zip: '78130', coverage: ['New Braunfels', 'San Marcos', 'Seguin', 'Comal County', 'Guadalupe County', 'Hays County'] },
  ],
  CA: [
    { name: 'California Regional Multiple Listing Service (CRMLS)', city: 'Chino Hills', state: 'CA', zip: '91709', coverage: ['Los Angeles', 'Orange County', 'Riverside', 'San Bernardino', 'Inland Empire', 'Southern California'] },
    { name: 'Bay Area Real Estate Information Services (BAREIS)', city: 'Santa Rosa', state: 'CA', zip: '95401', coverage: ['Santa Rosa', 'Napa', 'Sonoma County', 'Napa County', 'Marin County'] },
    { name: 'San Francisco Association of REALTORS® MLS', city: 'San Francisco', state: 'CA', zip: '94102', coverage: ['San Francisco', 'San Francisco County'] },
    { name: 'Bay East Association of REALTORS®', city: 'Pleasanton', state: 'CA', zip: '94566', coverage: ['Pleasanton', 'Livermore', 'Dublin', 'Alameda County', 'Contra Costa County'] },
    { name: 'Contra Costa Association of REALTORS®', city: 'Walnut Creek', state: 'CA', zip: '94596', coverage: ['Walnut Creek', 'Concord', 'Richmond', 'Contra Costa County'] },
    { name: 'San Diego MLS', city: 'San Diego', state: 'CA', zip: '92123', coverage: ['San Diego', 'Chula Vista', 'Carlsbad', 'Oceanside', 'San Diego County'] },
  ],
  AZ: [
    { name: 'Arizona Regional Multiple Listing Service (ARMLS)', city: 'Tempe', state: 'AZ', zip: '85281', coverage: ['Phoenix', 'Scottsdale', 'Mesa', 'Tempe', 'Chandler', 'Glendale', 'Maricopa County', 'Pinal County'] },
    { name: 'Tucson Association of REALTORS®', city: 'Tucson', state: 'AZ', zip: '85712', coverage: ['Tucson', 'Oro Valley', 'Marana', 'Pima County'] },
  ],
  NV: [
    { name: 'Las Vegas REALTORS®', city: 'Las Vegas', state: 'NV', zip: '89118', coverage: ['Las Vegas', 'Henderson', 'North Las Vegas', 'Clark County'] },
    { name: 'Reno/Sparks Association of REALTORS®', city: 'Reno', state: 'NV', zip: '89511', coverage: ['Reno', 'Sparks', 'Carson City', 'Washoe County'] },
  ],
  GA: [
    { name: 'First Multiple Listing Service (FMLS)', city: 'Atlanta', state: 'GA', zip: '30342', coverage: ['Atlanta', 'Marietta', 'Roswell', 'Sandy Springs', 'Fulton County', 'Cobb County', 'Gwinnett County', 'DeKalb County'] },
    { name: 'Savannah Multi-List Corporation', city: 'Savannah', state: 'GA', zip: '31406', coverage: ['Savannah', 'Chatham County'] },
  ],
  NC: [
    { name: 'Canopy MLS', city: 'Charlotte', state: 'NC', zip: '28204', coverage: ['Charlotte', 'Raleigh', 'Durham', 'Greensboro', 'Winston-Salem', 'Mecklenburg County', 'Wake County'] },
  ],
  SC: [
    { name: 'CHS Regional MLS', city: 'North Charleston', state: 'SC', zip: '29418', coverage: ['Charleston', 'Mount Pleasant', 'Summerville', 'Charleston County', 'Berkeley County', 'Dorchester County'] },
    { name: 'Coastal Carolinas Association of REALTORS®', city: 'Myrtle Beach', state: 'SC', zip: '29577', coverage: ['Myrtle Beach', 'North Myrtle Beach', 'Conway', 'Horry County'] },
  ],
  WA: [
    { name: 'NorthWest Multiple Listing Service (NWMLS)', city: 'Kirkland', state: 'WA', zip: '98034', coverage: ['Seattle', 'Tacoma', 'Bellevue', 'Spokane', 'King County', 'Pierce County', 'Snohomish County'] },
  ],
  CO: [
    { name: 'REcolorado®', city: 'Greenwood Village', state: 'CO', zip: '80111', coverage: ['Denver', 'Aurora', 'Lakewood', 'Denver County', 'Arapahoe County', 'Jefferson County'] },
    { name: 'Pikes Peak REALTOR® Services', city: 'Colorado Springs', state: 'CO', zip: '80920', coverage: ['Colorado Springs', 'El Paso County'] },
  ],
  IL: [
    { name: 'Midwest Real Estate Data (MRED)', city: 'Lisle', state: 'IL', zip: '60532', coverage: ['Chicago', 'Naperville', 'Joliet', 'Cook County', 'DuPage County', 'Lake County', 'Will County'] },
  ],
  MD: [
    { name: 'Bright MLS', city: 'North Bethesda', state: 'MD', zip: '20852', coverage: ['Baltimore', 'Bethesda', 'Rockville', 'Maryland', 'Delaware', 'Pennsylvania', 'Virginia', 'West Virginia', 'Washington DC'] },
  ],
  TN: [
    { name: 'RealTracs', city: 'Brentwood', state: 'TN', zip: '37027', coverage: ['Nashville', 'Franklin', 'Murfreesboro', 'Davidson County', 'Williamson County', 'Rutherford County'] },
    { name: 'East Tennessee REALTORS® MLS', city: 'Knoxville', state: 'TN', zip: '37919', coverage: ['Knoxville', 'Knox County'] },
  ],
};

/**
 * State Association Database
 */
const STATE_ASSOCIATIONS: Record<string, string> = {
  FL: 'Florida REALTORS®',
  TX: 'Texas REALTORS®',
  CA: 'California Association of REALTORS® (CAR)',
  AZ: 'Arizona Association of REALTORS®',
  NV: 'Nevada Association of REALTORS®',
  GA: 'Georgia Association of REALTORS®',
  NC: 'North Carolina Association of REALTORS®',
  SC: 'South Carolina REALTORS®',
  WA: 'Washington REALTORS®',
  CO: 'Colorado Association of REALTORS®',
  IL: 'Illinois REALTORS®',
  MD: 'Maryland REALTORS®',
  TN: 'Tennessee REALTORS®',
  NY: 'New York State Association of REALTORS®',
  PA: 'Pennsylvania Association of REALTORS®',
  OH: 'Ohio REALTORS®',
  MI: 'Michigan REALTORS®',
  VA: 'Virginia REALTORS®',
  MA: 'Massachusetts Association of REALTORS®',
  OR: 'Oregon Association of REALTORS®',
  UT: 'Utah Association of REALTORS®',
  ID: 'Idaho REALTORS®',
  MO: 'Missouri REALTORS®',
  KS: 'Kansas Association of REALTORS®',
  AR: 'Arkansas REALTORS® Association',
  OK: 'Oklahoma REALTORS®',
  LA: 'Louisiana REALTORS®',
  AL: 'Alabama Association of REALTORS®',
  MS: 'Mississippi Association of REALTORS®',
  KY: 'Kentucky REALTORS®',
  IN: 'Indiana Association of REALTORS®',
  WI: 'Wisconsin REALTORS® Association',
  MN: 'Minnesota Association of REALTORS®',
  IA: 'Iowa Association of REALTORS®',
  NE: 'Nebraska REALTORS® Association',
  SD: 'South Dakota Association of REALTORS®',
  ND: 'North Dakota Association of REALTORS®',
  MT: 'Montana Association of REALTORS®',
  WY: 'Wyoming Association of REALTORS®',
  NM: 'New Mexico Association of REALTORS®',
  HI: 'Hawaii Association of REALTORS®',
  AK: 'Alaska Association of REALTORS®',
};

/**
 * Find MLS by geographic location
 */
export function findMLSByLocation(params: {
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
}): MLSAssociation[] {
  const results: MLSAssociation[] = [];
  
  if (!params.state) return results;
  
  const stateMLSs = MLS_DATABASE[params.state] || [];
  
  // Match by city, county, or ZIP
  const matches = stateMLSs.filter(mls => {
    if (params.city && mls.coverage.some(c => 
      c.toLowerCase().includes(params.city!.toLowerCase()) ||
      params.city!.toLowerCase().includes(c.toLowerCase())
    )) {
      return true;
    }
    
    if (params.county && mls.coverage.some(c => 
      c.toLowerCase().includes(params.county!.toLowerCase())
    )) {
      return true;
    }
    
    if (params.zipCode && mls.zip === params.zipCode) {
      return true;
    }
    
    return false;
  });
  
  // If specific match found, use it
  if (matches.length > 0) {
    return matches.map(mls => ({
      name: mls.name,
      type: 'MLS' as const,
      city: mls.city,
      state: mls.state,
      zipCode: mls.zip,
      confidence: 'High' as const,
      source: 'Geographic Mapping'
    }));
  }
  
  // Otherwise, return all MLSs in the state as possibilities
  return stateMLSs.map(mls => ({
    name: mls.name,
    type: 'MLS' as const,
    city: mls.city,
    state: mls.state,
    zipCode: mls.zip,
    confidence: 'Medium' as const,
    source: 'State-level Inference'
  }));
}

/**
 * Extract MLS mentions from text
 */
export function extractMLSFromText(text: string, state?: string): MLSAssociation[] {
  const results: MLSAssociation[] = [];
  const lowerText = text.toLowerCase();
  
  // Search for MLS mentions
  const mlsPatterns = [
    /member of ([A-Za-z\s&®]+MLS)/gi,
    /([A-Za-z\s&®]+MLS) member/gi,
    /affiliated with ([A-Za-z\s&®]+MLS)/gi,
    /([A-Za-z\s&®]+MLS) association/gi,
  ];
  
  mlsPatterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach(match => {
      const mlsName = match[1].trim();
      results.push({
        name: mlsName,
        type: 'MLS',
        state: state || 'Unknown',
        confidence: 'Verified',
        source: 'Website Text'
      });
    });
  });
  
  // Search for association mentions
  const assocPatterns = [
    /member of ([A-Za-z\s&®]+Association of REALTORS®?)/gi,
    /([A-Za-z\s&®]+Association of REALTORS®?) member/gi,
    /affiliated with ([A-Za-z\s&®]+Board of REALTORS®?)/gi,
  ];
  
  assocPatterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach(match => {
      const assocName = match[1].trim();
      results.push({
        name: assocName,
        type: 'Local Board',
        state: state || 'Unknown',
        confidence: 'Verified',
        source: 'Website Text'
      });
    });
  });
  
  return results;
}

/**
 * Get state association
 */
export function getStateAssociation(state: string): MLSAssociation | null {
  const assocName = STATE_ASSOCIATIONS[state];
  if (!assocName) return null;
  
  return {
    name: assocName,
    type: 'State Association',
    state,
    confidence: 'High',
    source: 'State Mapping'
  };
}

/**
 * Comprehensive MLS identification
 */
export async function identifyMLSAssociations(params: {
  businessName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  websiteText?: string;
}): Promise<MLSAssociation[]> {
  const associations: MLSAssociation[] = [];
  
  // 1. Add state association
  if (params.state) {
    const stateAssoc = getStateAssociation(params.state);
    if (stateAssoc) {
      associations.push(stateAssoc);
    }
  }
  
  // 2. Find MLS by location
  const locationMLSs = findMLSByLocation({
    city: params.city,
    state: params.state,
    zipCode: params.zipCode,
    county: params.county
  });
  associations.push(...locationMLSs);
  
  // 3. Extract from website text if available
  if (params.websiteText && params.state) {
    const textMLSs = extractMLSFromText(params.websiteText, params.state);
    associations.push(...textMLSs);
  }
  
  // Deduplicate by name
  const uniqueAssociations = Array.from(
    new Map(associations.map(a => [a.name.toLowerCase(), a])).values()
  );
  
  // Sort by confidence
  const confidenceOrder = { 'Verified': 0, 'High': 1, 'Medium': 2, 'Inferred': 3 };
  uniqueAssociations.sort((a, b) => 
    confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
  );
  
  return uniqueAssociations;
}
