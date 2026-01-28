/**
 * Enhanced Web Scraping Service - Super Scrubbing Powerhouse
 * 
 * This service implements advanced scraping strategies including:
 * - Reverse lookups (email→domain, phone→location)
 * - Multi-stage enrichment pipeline
 * - Intelligent query building for sparse inputs
 * - Browser automation for deep scraping
 */

import axios from 'axios';
import type { ScrapedBusinessData } from './realWebScraper';
import { deepScrapeWebsite, scrapeNARDirectory, type DeepScrapedData } from './browserScraper';
import { identifyMLSAssociations, type MLSAssociation } from './mlsIntelligence';

/**
 * Extract domain from email address
 */
function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1] : null;
}

/**
 * Infer location from phone number area code
 */
function inferLocationFromPhone(phone: string): { city?: string, state?: string } | null {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 10) return null;
  
  const areaCode = digits.substring(0, 3);
  
  // Area code to location mapping (sample - expand as needed)
  const areaCodeMap: Record<string, { city: string, state: string }> = {
    '904': { city: 'Jacksonville', state: 'FL' },
    '305': { city: 'Miami', state: 'FL' },
    '407': { city: 'Orlando', state: 'FL' },
    '512': { city: 'Austin', state: 'TX' },
    '214': { city: 'Dallas', state: 'TX' },
    '713': { city: 'Houston', state: 'TX' },
    '212': { city: 'New York', state: 'NY' },
    '310': { city: 'Los Angeles', state: 'CA' },
    '415': { city: 'San Francisco', state: 'CA' },
    '619': { city: 'San Diego', state: 'CA' },
    '206': { city: 'Seattle', state: 'WA' },
    '303': { city: 'Denver', state: 'CO' },
    '312': { city: 'Chicago', state: 'IL' },
    '617': { city: 'Boston', state: 'MA' },
    '404': { city: 'Atlanta', state: 'GA' },
  };
  
  return areaCodeMap[areaCode] || null;
}

/**
 * Build intelligent search queries based on available data
 */
function buildSearchQueries(input: {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  state?: string;
}): string[] {
  const queries: string[] = [];
  
  // Strategy 1: If we have name + location, that's the best query
  if (input.name && (input.city || input.state)) {
    const location = [input.city, input.state].filter(Boolean).join(', ');
    queries.push(`${input.name} real estate ${location}`);
    queries.push(`${input.name} realtor ${location}`);
  }
  
  // Strategy 2: If we only have name, search broadly
  else if (input.name) {
    queries.push(`${input.name} real estate broker`);
    queries.push(`${input.name} realtor contact`);
  }
  
  // Strategy 3: Email reverse lookup
  if (input.email) {
    const domain = extractDomainFromEmail(input.email);
    if (domain) {
      queries.push(`site:${domain} real estate`);
      queries.push(`"${input.email}" realtor`);
    }
  }
  
  // Strategy 4: Phone reverse lookup
  if (input.phone) {
    queries.push(`"${input.phone}" real estate broker`);
    queries.push(`"${input.phone}" realtor`);
    
    // Try to infer location from area code
    const location = inferLocationFromPhone(input.phone);
    if (location) {
      queries.push(`real estate ${location.city} ${location.state} "${input.phone}"`);
    }
  }
  
  // Strategy 5: Website domain search
  if (input.website) {
    const domain = input.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    queries.push(`site:${domain} contact`);
    queries.push(`site:${domain} about team`);
  }
  
  // Strategy 6: State-only search (find major brokerages)
  if (input.state && !input.name && !input.city) {
    queries.push(`${input.state} real estate brokerages site:nar.realtor`);
    queries.push(`top real estate companies ${input.state}`);
  }
  
  return queries.slice(0, 3); // Return top 3 most relevant queries
}

/**
 * Search using Manus Forge API
 */
async function performSearch(queries: string[]): Promise<any[]> {
  try {
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!forgeApiUrl || !forgeApiKey) {
      console.warn('[EnhancedScraper] Forge API not configured');
      return [];
    }

    const response = await axios.post(
      `${forgeApiUrl}/omni_search`,
      {
        queries,
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
    console.error('[EnhancedScraper] Search failed:', error);
    return [];
  }
}

/**
 * Extract all contact information from text
 */
function extractAllContactInfo(text: string): {
  phones: string[];
  emails: string[];
  addresses: string[];
  names: string[];
  websites: string[];
} {
  const phones: string[] = [];
  const emails: string[] = [];
  const addresses: string[] = [];
  const names: string[] = [];
  const websites: string[] = [];

  // Phone patterns
  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatches = text.match(phonePattern);
  if (phoneMatches) {
    phones.push(...phoneMatches.map(p => p.replace(/\D/g, '')));
  }

  // Email pattern
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = text.match(emailPattern);
  if (emailMatches) {
    emails.push(...emailMatches);
  }

  // Address pattern
  const addressPattern = /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|suite|ste|#)\s*\d*/gi;
  const addressMatches = text.match(addressPattern);
  if (addressMatches) {
    addresses.push(...addressMatches);
  }

  // Name patterns (Capitalized First Last)
  const namePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
  const nameMatches = text.match(namePattern);
  if (nameMatches) {
    // Filter out common false positives
    const filtered = nameMatches.filter(name => 
      !name.match(/^(Real Estate|United States|New York|Los Angeles|San Francisco)$/i)
    );
    names.push(...filtered);
  }

  // Website/URL pattern
  const urlPattern = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
  const urlMatches = text.match(urlPattern);
  if (urlMatches) {
    websites.push(...urlMatches);
  }

  return {
    phones: Array.from(new Set(phones)),
    emails: Array.from(new Set(emails)),
    addresses: Array.from(new Set(addresses)),
    names: Array.from(new Set(names)),
    websites: Array.from(new Set(websites))
  };
}

/**
 * Determine business name from various clues
 */
function inferBusinessName(input: {
  name?: string;
  email?: string;
  website?: string;
  searchResults: any[];
}): string {
  // If name provided, use it
  if (input.name) return input.name;
  
  // Try to extract from email domain
  if (input.email) {
    const domain = extractDomainFromEmail(input.email);
    if (domain) {
      // Convert domain to business name (e.g., themilitarygroup.us → The Military Group)
      const nameParts = domain.split('.')[0].split(/[-_]/);
      const businessName = nameParts
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      return businessName;
    }
  }
  
  // Try to extract from website
  if (input.website) {
    const domain = input.website.replace(/^https?:\/\//, '').split('/')[0];
    const nameParts = domain.split('.')[0].split(/[-_]/);
    const businessName = nameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return businessName;
  }
  
  // Try to extract from search results title
  if (input.searchResults.length > 0 && input.searchResults[0].title) {
    const title = input.searchResults[0].title;
    // Extract business name before common separators
    const match = title.match(/^([^-|:]+)/);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'Unknown Business';
}

/**
 * Multi-stage enrichment: Process search results and extract comprehensive data
 */
function enrichDataFromResults(
  searchResults: any[],
  input: {
    name?: string;
    phone?: string;
    email?: string;
    website?: string;
    city?: string;
    state?: string;
  }
): Partial<ScrapedBusinessData> {
  let phone: string | undefined = input.phone;
  let email: string | undefined = input.email;
  let website: string | undefined = input.website;
  let address: string | undefined;
  let city: string | undefined = input.city;
  let state: string | undefined = input.state;
  let zipCode: string | undefined;
  const contacts: Array<{ name: string; role: string; phone?: string; email?: string }> = [];
  const dataSources: string[] = ['Google Search'];
  let confidence = 20;

  // Process all search results
  for (const result of searchResults.slice(0, 10)) {
    const resultText = `${result.title || ''} ${result.snippet || ''} ${result.url || ''}`;
    const extracted = extractAllContactInfo(resultText);

    // Collect phone numbers
    if (extracted.phones.length > 0 && !phone) {
      phone = extracted.phones[0];
      confidence += 15;
    }

    // Collect emails
    if (extracted.emails.length > 0 && !email) {
      email = extracted.emails[0];
      confidence += 15;
    }

    // Collect website
    if (result.url && !website) {
      // Prefer URLs that look like business websites
      if (result.url.match(/\.(com|us|net|org)/)) {
        website = result.url;
        confidence += 10;
      }
    }

    // Collect addresses
    if (extracted.addresses.length > 0 && !address) {
      address = extracted.addresses[0];
      confidence += 10;
    }

    // Extract location from text if not provided
    if (!city || !state) {
      const statePattern = /\b([A-Z]{2})\b/g;
      const stateMatches = resultText.match(statePattern);
      if (stateMatches && !state) {
        state = stateMatches[0];
      }

      const cityPattern = /,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*[A-Z]{2}/;
      const cityMatch = resultText.match(cityPattern);
      if (cityMatch && !city) {
        city = cityMatch[1];
      }
    }

    // Extract ZIP code
    if (!zipCode) {
      const zipPattern = /\b\d{5}(?:-\d{4})?\b/;
      const zipMatch = resultText.match(zipPattern);
      if (zipMatch) {
        zipCode = zipMatch[0];
      }
    }

    // Extract contact names and roles
    const rolePatterns = [
      { pattern: /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:Owner|Broker|Managing Broker)/gi, role: 'Owner/Broker' },
      { pattern: /(?:Owner|Broker):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi, role: 'Owner/Broker' },
      { pattern: /owned\s+(?:and\s+)?operated\s+by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi, role: 'Owner' },
      { pattern: /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:Office Manager|Admin|Administrator)/gi, role: 'Office Manager' },
      { pattern: /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(?:Transaction Coordinator)/gi, role: 'Transaction Coordinator' },
    ];

    rolePatterns.forEach(({ pattern, role }) => {
      const matches = Array.from(resultText.matchAll(pattern));
      matches.forEach(match => {
        if (match[1]) {
          const name = match[1].trim();
          if (!contacts.find(c => c.name === name)) {
            contacts.push({ name, role });
            confidence += 5;
          }
        }
      });
    });
  }

  // Infer location from phone if still missing
  if (!city && !state && phone) {
    const location = inferLocationFromPhone(phone);
    if (location) {
      city = location.city;
      state = location.state;
      confidence += 5;
      dataSources.push('Phone Area Code Inference');
    }
  }

  // Infer business name
  const businessName = inferBusinessName({
    name: input.name,
    email: input.email || email,
    website: input.website || website,
    searchResults
  });

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
    dataSources,
    confidence: Math.min(confidence, 95)
  };
}

/**
 * Main enhanced scraping function
 */
export async function scrapeWithEnhancements(input: {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): Promise<ScrapedBusinessData> {
  console.log('[EnhancedScraper] Starting enhanced scraping with input:', input);

  // Step 1: Build intelligent search queries
  const queries = buildSearchQueries(input);
  console.log('[EnhancedScraper] Search queries:', queries);

  if (queries.length === 0) {
    console.warn('[EnhancedScraper] No valid queries could be built from input');
    return {
      name: input.name || 'Unknown Business',
      contacts: [],
      mlsAssociations: [],
      dataSources: [],
      confidence: 0
    };
  }

  // Step 2: Perform search
  const searchResults = await performSearch(queries);
  console.log(`[EnhancedScraper] Found ${searchResults.length} search results`);

  if (searchResults.length === 0) {
    return {
      name: input.name || 'Unknown Business',
      contacts: [],
      mlsAssociations: [],
      dataSources: ['Google Search (no results)'],
      confidence: 0
    };
  }

  // Step 3: Multi-stage enrichment
  const enrichedData = enrichDataFromResults(searchResults, input);
  
  // Step 4: Placeholder for MLS associations (will be populated in Step 7)

  // Step 5: If we found a website, do deep browser scraping
  let deepScrapedData: DeepScrapedData | null = null;
  if (enrichedData.website) {
    console.log(`[EnhancedScraper] Performing deep scrape of website: ${enrichedData.website}`);
    try {
      deepScrapedData = await deepScrapeWebsite(enrichedData.website);
      
      // Merge deep scraped data
      if (deepScrapedData.contacts.length > 0) {
        enrichedData.contacts = [
          ...(enrichedData.contacts || []),
          ...deepScrapedData.contacts
        ];
        enrichedData.confidence = Math.min((enrichedData.confidence || 0) + 20, 95);
        enrichedData.dataSources?.push('Deep Website Scraping');
      }
      
      if (deepScrapedData.emails.length > 0 && !enrichedData.email) {
        enrichedData.email = deepScrapedData.emails[0];
        enrichedData.confidence = Math.min((enrichedData.confidence || 0) + 10, 95);
      }
      
      if (deepScrapedData.phones.length > 0 && !enrichedData.phone) {
        enrichedData.phone = deepScrapedData.phones[0];
        enrichedData.confidence = Math.min((enrichedData.confidence || 0) + 10, 95);
      }
      
      if (deepScrapedData.addresses.length > 0 && !enrichedData.address) {
        enrichedData.address = deepScrapedData.addresses[0];
        enrichedData.confidence = Math.min((enrichedData.confidence || 0) + 5, 95);
      }
    } catch (error) {
      console.error('[EnhancedScraper] Deep scraping failed:', error);
    }
  }
  
  // Step 6: Try NAR directory scraping for verification
  if (enrichedData.name && enrichedData.state) {
    console.log(`[EnhancedScraper] Checking NAR directory for ${enrichedData.name}`);
    try {
      const narData = await scrapeNARDirectory(enrichedData.name, enrichedData.state);
      
      if (narData.contacts && narData.contacts.length > 0) {
        enrichedData.contacts = [
          ...(enrichedData.contacts || []),
          ...narData.contacts
        ];
        enrichedData.confidence = Math.min((enrichedData.confidence || 0) + 15, 95);
        enrichedData.dataSources?.push('NAR Directory');
      }
    } catch (error) {
      console.error('[EnhancedScraper] NAR scraping failed:', error);
    }
  }

  // Step 7: Identify MLS and association memberships
  console.log('[EnhancedScraper] Identifying MLS and association memberships');
  let mlsAssociations: MLSAssociation[] = [];
  try {
    mlsAssociations = await identifyMLSAssociations({
      businessName: enrichedData.name,
      city: enrichedData.city,
      state: enrichedData.state,
      zipCode: enrichedData.zipCode,
      websiteText: deepScrapedData?.about
    });
    
    if (mlsAssociations.length > 0) {
      console.log(`[EnhancedScraper] Found ${mlsAssociations.length} MLS/association memberships`);
      enrichedData.confidence = Math.min((enrichedData.confidence || 0) + 10, 95);
    }
  } catch (error) {
    console.error('[EnhancedScraper] MLS identification failed:', error);
  }

  const finalData: ScrapedBusinessData = {
    name: enrichedData.name || input.name || 'Unknown Business',
    phone: enrichedData.phone,
    email: enrichedData.email,
    website: enrichedData.website,
    address: enrichedData.address || input.address,
    city: enrichedData.city,
    state: enrichedData.state,
    zipCode: enrichedData.zipCode || input.zipCode,
    contacts: enrichedData.contacts || [],
    mlsAssociations,
    dataSources: enrichedData.dataSources || ['Google Search'],
    confidence: enrichedData.confidence || 0
  };

  console.log(`[EnhancedScraper] Scraping complete. Confidence: ${finalData.confidence}%`);
  
  return finalData;
}
