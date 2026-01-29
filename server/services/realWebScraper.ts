/**
 * Real Web Scraping Service
 * 
 * This service performs actual web scraping using the Manus search tool
 * to find real business information from Google, business websites, and directories.
 */

import axios from 'axios';

import type { MLSAssociation } from './mlsIntelligence';

export interface ScrapedBusinessData {
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contacts: Array<{
    name: string;
    role: string;
    phone?: string;
    email?: string;
  }>;
  mlsAssociations: MLSAssociation[];
  dataSources: string[];
  confidence: number;
  technologyStack?: any;
}

/**
 * Search for business using Manus built-in search
 */
async function searchBusiness(businessName: string, location?: string): Promise<any[]> {
  try {
    const query = location ? `${businessName} ${location}` : businessName;
    
    // Use Manus Forge API for web search
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!forgeApiUrl || !forgeApiKey) {
      console.warn('[RealWebScraper] Forge API not configured');
      return [];
    }

    const response = await axios.post(
      `${forgeApiUrl}/omni_search`,
      {
        queries: [query, `${businessName} real estate contact`],
        search_type: 'info',
        time: 'all'
      },
      {
        headers: {
          'Authorization': `Bearer ${forgeApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data?.results || [];
  } catch (error) {
    console.error('[RealWebScraper] Search failed:', error);
    return [];
  }
}

/**
 * Extract contact information from text using regex patterns
 */
function extractContactInfo(text: string): { phones: string[], emails: string[] } {
  const phones: string[] = [];
  const emails: string[] = [];

  // Phone patterns
  const phonePatterns = [
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,  // (904) 719-2702 or 904-719-2702
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/g,          // 904.719.2702
  ];

  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      phones.push(...matches.map(p => p.replace(/[^\d]/g, '')));
    }
  });

  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = text.match(emailPattern);
  if (emailMatches) {
    emails.push(...emailMatches);
  }

  return {
    phones: Array.from(new Set(phones)),  // Remove duplicates
    emails: Array.from(new Set(emails))
  };
}

/**
 * Extract address information from text
 */
function extractAddress(text: string): { address?: string, city?: string, state?: string, zipCode?: string } {
  // Address pattern: street number + street name
  const addressPattern = /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|suite|ste|#)\s*\d*/gi;
  const addressMatch = text.match(addressPattern);

  // ZIP code pattern
  const zipPattern = /\b\d{5}(?:-\d{4})?\b/g;
  const zipMatch = text.match(zipPattern);

  // State abbreviation pattern
  const statePattern = /\b[A-Z]{2}\b/g;
  const stateMatches = text.match(statePattern);

  // City pattern (word before state)
  let city: string | undefined;
  if (stateMatches && stateMatches.length > 0) {
    const stateIndex = text.indexOf(stateMatches[0]);
    const beforeState = text.substring(Math.max(0, stateIndex - 50), stateIndex);
    const cityMatch = beforeState.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*$/);
    if (cityMatch) {
      city = cityMatch[1].trim();
    }
  }

  return {
    address: addressMatch ? addressMatch[0] : undefined,
    city,
    state: stateMatches ? stateMatches[0] : undefined,
    zipCode: zipMatch ? zipMatch[0] : undefined
  };
}

/**
 * Extract owner/broker names from text
 */
function extractOwnerNames(text: string, businessName: string): Array<{ name: string, role: string }> {
  const contacts: Array<{ name: string, role: string }> = [];
  
  // Look for common real estate roles
  const rolePatterns = [
    /(?:owner|broker|managing broker|team lead|principal):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
    /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:owner|broker|managing broker)/gi,
    /owned\s+(?:and\s+)?operated\s+by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
  ];

  rolePatterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach(match => {
      if (match[1]) {
        const name = match[1].trim();
        const role = match[0].toLowerCase().includes('owner') ? 'Owner/Broker' : 
                     match[0].toLowerCase().includes('broker') ? 'Broker' : 'Team Lead';
        contacts.push({ name, role });
      }
    });
  });

  return contacts;
}

/**
 * Main scraping function that orchestrates all data gathering
 */
export async function scrapeBusinessData(searchParams: {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): Promise<ScrapedBusinessData> {
  const dataSources: string[] = [];
  let confidence = 0;

  // Build search query
  const location = [searchParams.city, searchParams.state].filter(Boolean).join(', ');
  const businessName = searchParams.name || 'Unknown Business';

  console.log(`[RealWebScraper] Searching for: ${businessName} ${location}`);

  // Step 1: Search for the business
  const searchResults = await searchBusiness(businessName, location);
  
  if (searchResults.length === 0) {
    console.warn('[RealWebScraper] No search results found');
    return {
      name: businessName,
      contacts: [],
      mlsAssociations: [],
      dataSources: [],
      confidence: 0
    };
  }

  dataSources.push('Google Search');
  confidence += 20;

  // Step 2: Extract data from search results
  let phone: string | undefined = searchParams.phone;
  let email: string | undefined = searchParams.email;
  let website: string | undefined = searchParams.website;
  let address: string | undefined = searchParams.address;
  let city: string | undefined = searchParams.city;
  let state: string | undefined = searchParams.state;
  let zipCode: string | undefined = searchParams.zipCode;
  const contacts: Array<{ name: string, role: string, phone?: string, email?: string }> = [];

  // Process top search results
  for (const result of searchResults.slice(0, 5)) {
    const resultText = `${result.title || ''} ${result.snippet || ''} ${result.url || ''}`;
    
    // Extract contact info
    const { phones, emails } = extractContactInfo(resultText);
    if (phones.length > 0 && !phone) {
      phone = phones[0];
      confidence += 15;
    }
    if (emails.length > 0 && !email) {
      email = emails[0];
      confidence += 15;
    }

    // Extract website
    if (result.url && !website && result.url.includes(businessName.toLowerCase().replace(/\s+/g, ''))) {
      website = result.url;
      confidence += 10;
    }

    // Extract address
    const addressInfo = extractAddress(resultText);
    if (addressInfo.address && !address) {
      address = addressInfo.address;
      confidence += 10;
    }
    if (addressInfo.city && !city) {
      city = addressInfo.city;
    }
    if (addressInfo.state && !state) {
      state = addressInfo.state;
    }
    if (addressInfo.zipCode && !zipCode) {
      zipCode = addressInfo.zipCode;
    }

    // Extract owner/broker names
    const extractedContacts = extractOwnerNames(resultText, businessName);
    extractedContacts.forEach(contact => {
      if (!contacts.find(c => c.name === contact.name)) {
        contacts.push(contact);
        confidence += 5;
      }
    });
  }

  // Step 3: Determine MLS associations using comprehensive intelligence system
  const { identifyMLSAssociations } = await import('./mlsIntelligence');
  const mlsAssociations = await identifyMLSAssociations({
    businessName,
    city,
    state,
    zipCode
  });
  
  if (mlsAssociations.length > 0) {
    confidence += 10;
  }

  // Cap confidence at 95 (never 100% certain)
  confidence = Math.min(confidence, 95);

  console.log(`[RealWebScraper] Scraping complete. Confidence: ${confidence}%`);

  return {
    name: businessName,
    phone,
    email,
    website,
    address,
    city,
    state,
    zipCode,
    contacts,
    mlsAssociations,
    dataSources,
    confidence
  };
}
