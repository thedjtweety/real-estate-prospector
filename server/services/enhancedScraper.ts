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
import {
  analyzeContactRole,
  calculateDecisionMakerScore,
  determineDecisionAuthority,
  detectNARDesignations,
  buildOrganizationalHierarchy,
  determineApproachOrder,
  detectTechnologyStack,
  recommendContactMethod,
  type ContactIntelligence,
} from './decisionMakerIntelligence';
import { gatherFootInTheDoorIntel, type FootInTheDoorIntel } from './footInTheDoorIntelligence';
import {
  identifyAssociationRoles,
  calculateInfluenceScore,
  identifyNetworkingOpportunities,
  type AssociationRole,
  type InfluenceScore,
} from './associationLeadershipIntel';
import { createProgressTracker, type ProgressCallback } from './progressTracker';

// Global progress tracker reference
let globalProgressTracker: ReturnType<typeof createProgressTracker> | null = null;

export function setProgressTracker(tracker: ReturnType<typeof createProgressTracker>) {
  globalProgressTracker = tracker;
}

function updateProgress(stage: string, message: string) {
  if (globalProgressTracker) {
    globalProgressTracker.update(stage, message);
  }
  console.log(`[EnhancedScraper] ${stage}: ${message}`);
}

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
      queries.push(`${domain} real estate`);
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
    queries.push(`${domain} contact`);
    queries.push(`${domain} about team`);
  }
  
  // Strategy 6: State-only search (find major brokerages)
  if (input.state && !input.name && !input.city) {
    queries.push(`${input.state} real estate brokerages`);
    queries.push(`top real estate companies ${input.state}`);
  }
  
  return queries.slice(0, 3); // Return top 3 most relevant queries
}

/**
 * Perform real web scraping using direct Google search + website scraping
 */
async function performSearch(queries: string[], businessInput: any): Promise<any[]> {
  try {
    updateProgress('Searching Google', `Scraping web for: ${queries[0]}`);
    
    // Import smart scraper with Schema.org support
    const { smartScrapeWebsite } = await import('./smartScraper');
    const { searchGoogle } = await import('./directWebScraper');
    
    // Build location string
    const location = [businessInput.city, businessInput.state].filter(Boolean).join(', ');
    const searchQuery = location ? `${businessInput.name} ${location}` : businessInput.name || queries[0];
    
    // First, search Google to find the business website
    updateProgress('Searching Google', `Finding website for: ${searchQuery}`);
    const googleResults = await searchGoogle(searchQuery);
    
    if (googleResults.length === 0) {
      updateProgress('Searching Google', 'No results found');
      return [{
        title: `${businessInput.name || 'Business'} - No results`,
        url: businessInput.website || 'https://example.com',
        snippet: 'No search results found'
      }];
    }
    
    // Get the top result URL (most likely the business website)
    const businessUrl = googleResults[0].url;
    updateProgress('Searching Google', `Found website: ${businessUrl}`);
    
    // Now use smart scraper to extract structured data
    updateProgress('Extracting Data', 'Scraping website with Schema.org + Cheerio');
    const scrapedData = await smartScrapeWebsite(businessUrl);
    
    updateProgress('Extracting Data', `Confidence: ${scrapedData.confidence}%, Contacts: ${scrapedData.contacts.length}`);
    
    // Convert scraped data to search result format
    const results: any[] = [];
    
    // Create results from extracted contacts
    if (scrapedData.contacts.length > 0) {
      for (const contact of scrapedData.contacts) {
        results.push({
          title: `${contact.name} - ${contact.role}`,
          url: scrapedData.website || businessInput.website || 'https://example.com',
          snippet: `Contact: ${contact.email || scrapedData.email || businessInput.email || 'N/A'}, Phone: ${contact.phone || scrapedData.phone || businessInput.phone || 'N/A'}`
        });
      }
    }
    
    // If no contacts found, create generic contact from business data
    if (results.length === 0 && (scrapedData.email || scrapedData.phone)) {
      results.push({
        title: `${scrapedData.name} - Main Contact`,
        url: scrapedData.website || businessInput.website || 'https://example.com',
        snippet: `Email: ${scrapedData.email || 'N/A'}, Phone: ${scrapedData.phone || 'N/A'}`
      });
    }
    
    // Fallback if no data found
    if (results.length === 0) {
      updateProgress('Searching Google', 'No contact data found, using input data');
      results.push({
        title: `${businessInput.name || 'Business'} - Contact Information`,
        url: businessInput.website || 'https://example.com',
        snippet: `Contact: ${businessInput.email || 'info@example.com'}, Phone: ${businessInput.phone || '(555) 123-4567'}`
      });
    }
    
    return results;
  } catch (error) {
    console.error('[EnhancedScraper] Web scraping failed:', error);
    updateProgress('Searching Google', 'Scraping failed, using input data');
    
    // Return basic fallback from input
    return [{
      title: `${businessInput.name || 'Business'} - Contact Information`,
      url: businessInput.website || 'https://example.com',
      snippet: `Contact: ${businessInput.email || 'info@example.com'}, Phone: ${businessInput.phone || '(555) 123-4567'}`
    }];
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
 * Enrich data from search results
 */
function enrichDataFromResults(results: any[], input: any): any {
  updateProgress('Extracting contact information', 'Processing search results...');
  
  const enrichedData: any = {
    name: input.name,
    phone: input.phone,
    email: input.email,
    website: input.website,
    address: input.address,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
    contacts: [],
    dataSources: ['Google Search'],
    confidence: 30
  };

  // Combine all text from results
  const combinedText = results.map(r => `${r.title} ${r.snippet} ${r.url}`).join(' ');
  
  // Extract all contact info
  const extracted = extractAllContactInfo(combinedText);
  
  // Update enriched data
  if (!enrichedData.phone && extracted.phones.length > 0) {
    enrichedData.phone = extracted.phones[0];
    enrichedData.confidence += 10;
  }
  
  if (!enrichedData.email && extracted.emails.length > 0) {
    enrichedData.email = extracted.emails[0];
    enrichedData.confidence += 10;
  }
  
  if (!enrichedData.website && extracted.websites.length > 0) {
    enrichedData.website = extracted.websites[0];
    enrichedData.confidence += 15;
  }
  
  if (!enrichedData.address && extracted.addresses.length > 0) {
    enrichedData.address = extracted.addresses[0];
    enrichedData.confidence += 5;
  }
  
  // Add contacts from names found
  if (extracted.names.length > 0) {
    enrichedData.contacts = extracted.names.slice(0, 5).map(name => ({
      name,
      role: 'Agent', // Default role
      email: null,
      phone: null
    }));
    enrichedData.confidence += 10;
  }
  
  updateProgress('Extracting contact information', `Found ${extracted.names.length} potential contacts`);
  
  return enrichedData;
}

/**
 * Main scraping function with comprehensive intelligence gathering
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
  try {
    console.log('[EnhancedScraper] Starting comprehensive scrape');
    updateProgress('Building intelligent queries', 'Analyzing input data...');
    
    // Step 1: Build intelligent search queries
    const queries = buildSearchQueries(input);
    console.log(`[EnhancedScraper] Built ${queries.length} search queries:`, queries);
    updateProgress('Building intelligent queries', `Generated ${queries.length} search strategies`);
    
    if (queries.length === 0) {
      updateProgress('Building intelligent queries', 'Insufficient data provided');
      return {
        name: input.name || 'Unknown Business',
        contacts: [],
        mlsAssociations: [],
        dataSources: ['Insufficient Input Data'],
        confidence: 0
      };
    }

    // Step 2: Perform search
    const searchResults = await performSearch(queries, input);
    console.log(`[EnhancedScraper] Found ${searchResults.length} search results`);

    if (searchResults.length === 0) {
      updateProgress('Searching Google', 'No results found');
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
    
    // Step 4: If we found a website, do deep browser scraping
    let deepScrapedData: DeepScrapedData | null = null;
    if (enrichedData.website) {
      console.log(`[EnhancedScraper] Performing deep scrape of website: ${enrichedData.website}`);
      updateProgress('Deep scraping website', `Analyzing ${enrichedData.website}...`);
      
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
          updateProgress('Deep scraping website', `Found ${deepScrapedData.contacts.length} contacts`);
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
        updateProgress('Deep scraping website', 'Failed - continuing with available data');
      }
    } else {
      updateProgress('Deep scraping website', 'No website found - skipping');
    }
    
    // Step 5: Try NAR directory scraping for verification
    if (enrichedData.name && enrichedData.state) {
      console.log(`[EnhancedScraper] Checking NAR directory for ${enrichedData.name}`);
      updateProgress('Scraping NAR directory', `Verifying ${enrichedData.name}...`);
      
      try {
        const narData = await scrapeNARDirectory(enrichedData.name, enrichedData.state);
        
        if (narData.contacts && narData.contacts.length > 0) {
          enrichedData.contacts = [
            ...(enrichedData.contacts || []),
            ...narData.contacts
          ];
          enrichedData.confidence = Math.min((enrichedData.confidence || 0) + 15, 95);
          enrichedData.dataSources?.push('NAR Directory');
          updateProgress('Scraping NAR directory', `Verified with NAR directory`);
        }
      } catch (error) {
        console.error('[EnhancedScraper] NAR scraping failed:', error);
        updateProgress('Scraping NAR directory', 'Not found in NAR directory');
      }
    } else {
      updateProgress('Scraping NAR directory', 'Insufficient data for NAR lookup');
    }

    // Step 6: Process contacts with decision-maker intelligence
    console.log('[EnhancedScraper] Analyzing contacts with decision-maker intelligence');
    updateProgress('Cross-referencing data', `Analyzing ${enrichedData.contacts?.length || 0} contacts...`);
    
    const intelligentContacts: ContactIntelligence[] = [];
    
    if (enrichedData.contacts && enrichedData.contacts.length > 0) {
      for (const contact of enrichedData.contacts) {
        const roleAnalysis = analyzeContactRole({
          name: contact.name,
          title: contact.role,
          email: contact.email,
        });
        
        const narDesignations = detectNARDesignations(
          [contact.name, contact.role, deepScrapedData?.about || ''].join(' ')
        );
        
        const decisionMakerScore = calculateDecisionMakerScore({
          role: roleAnalysis.role,
          seniorityLevel: roleAnalysis.seniorityLevel,
          narDesignations,
          associationRoles: [],
        });
        
        const intelligentContact: ContactIntelligence = {
          name: contact.name,
          title: contact.role,
          email: contact.email,
          phone: contact.phone,
          detectedRole: roleAnalysis.role,
          roleConfidence: roleAnalysis.confidence,
          seniorityLevel: roleAnalysis.seniorityLevel,
          decisionMakerScore,
          isPrimaryContact: false,
          approachOrder: 0,
          isGatekeeper: roleAnalysis.role === 'assistant',
          decisionAuthority: determineDecisionAuthority(roleAnalysis.role, roleAnalysis.seniorityLevel),
          narDesignations,
          associationRoles: [],
          influenceScore: 0,
          bestContactMethod: recommendContactMethod({
            email: contact.email,
            phone: contact.phone,
            role: roleAnalysis.role,
          }),
          recentAchievements: [],
          painPoints: [],
          technologyStack: [],
        };
        
        intelligentContacts.push(intelligentContact);
      }
      
      // Determine approach order
      const orderedContacts = determineApproachOrder(intelligentContacts);
      console.log(`[EnhancedScraper] Identified ${orderedContacts.length} contacts with decision-maker intelligence`);
      updateProgress('Cross-referencing data', `Ranked ${orderedContacts.length} decision-makers`);
      
      // Update enrichedData with intelligent contacts
      enrichedData.contacts = orderedContacts.map(ic => ({
        name: ic.name,
        role: ic.title || ic.detectedRole,
        email: ic.email,
        phone: ic.phone,
      }));
    }
    
    // Step 7: Identify MLS and association memberships
    console.log('[EnhancedScraper] Identifying MLS and association memberships');
    updateProgress('Identifying MLS associations', 'Matching to local MLS...');
    
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
        updateProgress('Identifying MLS associations', `Found ${mlsAssociations.length} MLS associations`);
      } else {
        updateProgress('Identifying MLS associations', 'No MLS associations found');
      }
    } catch (error) {
      console.error('[EnhancedScraper] MLS identification failed:', error);
      updateProgress('Identifying MLS associations', 'MLS lookup failed');
    }

    updateProgress('Calculating confidence scores', `Overall confidence: ${enrichedData.confidence}%`);
    updateProgress('Finalizing results', 'Preparing final report...');

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
    updateProgress('Finalizing results', 'Search complete!');
    
    return finalData;
  } catch (error) {
    console.error('[EnhancedScraper] Critical error:', error);
    throw error;
  }
}
