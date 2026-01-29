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
import { getLocationFromAreaCode } from './areaCodeMap';
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
import { extractBusinessName } from './businessNameExtractor';
import { verifyRealEstateIndustry, isObviouslyNotRealEstate } from './industryVerifier';
import { analyzeBusinessIntelligence } from './businessIntelligence';
import { enrichContacts } from './contactEnrichment';
import { lookupStateLicense } from './stateLicenseLookups';
import { generateSearchQueries, generateContactQueries, type SearchInput } from './multiSearchQueryGenerator';
import { executeParallelSearches, aggregateSearchResults } from './parallelSearchExecutor';
import { analyzeSearchResults, analyzeContactDetails } from './intelligentResultAnalyzer';
import { crossReferenceData, deduplicateContacts } from './crossReferenceValidator';
import { detectPersonVsBusiness } from './personVsBusinessDetector';
import { generateAgentToBrokerageQueries } from './agentToBrokerageQueries';
import { analyzeHierarchicalRelationship, scoreHierarchicalRelationship } from './hierarchicalRelationshipAnalyzer';
import { generateContactEnrichmentQueries } from './contactEnrichmentQueries';
import { analyzeContactEnrichment, scoreEnrichment } from './contactEnrichmentAnalyzer';
import { analyzeBrokerageTechnologyStack, type TechnologyStackProfile } from './technologyDetectionIntegration';

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
 * Infer location from phone number area code using areacodes library
 * Supports ALL US/Canada area codes automatically
 */
function inferLocationFromPhone(phone: string): { city?: string, state?: string } | null {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 10) return null;
  
  const areaCode = digits.substring(0, 3);
  
  // Use custom area code map to lookup location (supports 300+ area codes)
  const location = getLocationFromAreaCode(areaCode);
  
  if (location && location.state) {
    return {
      city: location.city || undefined,
      state: location.state,
    };
  }
  
  return null;
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
    // Format phone in multiple ways for better Google matching
    const digits = input.phone.replace(/\D/g, '');
    const formatted1 = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`; // (513) 600-4117
    const formatted2 = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`; // 513-600-4117
    
    queries.push(`"${formatted1}" real estate`);
    queries.push(`"${formatted2}" realtor`);
    queries.push(`"${input.phone}" real estate broker`);
    
    // Try to infer location from area code
    const location = inferLocationFromPhone(input.phone);
    if (location) {
      queries.push(`real estate ${location.city} ${location.state} "${formatted1}"`);
      queries.push(`realtor ${location.city} "${formatted2}"`);
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
    // Use Brave Search API (2,000 free/month) with DuckDuckGo fallback (unlimited)
    const { searchBusinessBrave } = await import('./braveSearchAPI');
    const { searchBusinessDDG } = await import('./duckDuckGoScraper');
    
    // Build location string
    const location = [businessInput.city, businessInput.state].filter(Boolean).join(', ');
    const searchQuery = location ? `${businessInput.name} ${location}` : businessInput.name || queries[0];
    
    // First, try Brave Search API (free tier: 2,000/month)
    updateProgress('Searching', `Finding website for: ${searchQuery}`);
    let searchResults = await searchBusinessBrave(
      businessInput.name || '',
      location,
      businessInput.phone
    );
    
    // If Brave fails or returns no results, fallback to DuckDuckGo (unlimited)
    if (searchResults.length === 0) {
      console.log('[EnhancedScraper] Brave returned no results, trying DuckDuckGo fallback');
      updateProgress('Searching', 'Trying DuckDuckGo fallback...');
      searchResults = await searchBusinessDDG(
        businessInput.name || '',
        location,
        businessInput.phone
      );
    }
    
    if (searchResults.length === 0) {
      updateProgress('Searching', 'No results found from any search engine');
      return [{
        title: `${businessInput.name || 'Business'} - No results`,
        url: businessInput.website || 'https://example.com',
        snippet: 'No search results found'
      }];
    }
    
    // Get the top result URL (most likely the business website)
    const businessUrl = searchResults[0].url;
    updateProgress('Searching', `Found website: ${businessUrl}`);
    
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
    
    // If no contacts found, don't create fake "Main Contact" placeholder
    // Real contacts should be extracted from the website or search results
    // Empty contact list is better than fake data
    
    // Fallback if no data found
    if (results.length === 0) {
      updateProgress('Searching', 'No contact data found, using input data');
      results.push({
        title: `${businessInput.name || 'Business'} - Contact Information`,
        url: businessInput.website || 'https://example.com',
        snippet: `Contact: ${businessInput.email || 'info@example.com'}, Phone: ${businessInput.phone || '(555) 123-4567'}`
      });
    }
    
    return results;
  } catch (error) {
    console.error('[EnhancedScraper] Web scraping failed:', error);
    updateProgress('Searching', 'Scraping failed, using input data');
    
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

  // Name patterns (Capitalized First Last) - Import name validator
  const { extractValidNames } = require('./nameValidator');
  const extractedNames = extractValidNames(text);
  
  // Additional filtering for real estate context
  const filtered = extractedNames.filter((name: string) => {
    const lower = name.toLowerCase();
    // Filter out common false positives
    return !lower.match(/real estate|united states|new york|los angeles|main contact|contact us|about us|our team/);
  });
  
  names.push(...filtered);

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
  
  // Extract business name from search results
  const extractedName = extractBusinessName({
    searchResults: results,
    userInput: input.name
  });
  
  const enrichedData: any = {
    name: extractedName,
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
}): Promise<ScrapedBusinessData & { technologyStack?: any }> {
  try {
    console.log('[EnhancedScraper] Starting comprehensive scrape');
    updateProgress('Analyzing input', 'Determining search type...');
    
    // Step 0: Detect if this is a person (agent) or business (brokerage) search
    const detection = await detectPersonVsBusiness({
      name: input.name,
      phone: input.phone,
      email: input.email
    });
    console.log(`[EnhancedScraper] Detection: ${detection.type} (${detection.confidence}% confidence) - ${detection.reasoning}`);
    updateProgress('Analyzing input', `Detected: ${detection.type === 'person' ? 'Individual Agent' : 'Business/Brokerage'}`);
    
    const isAgentSearch = detection.type === 'person' && detection.confidence >= 60;
    
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

    // Step 2: Generate multi-search queries (10-15 targeted searches)
    updateProgress('Generating search strategy', 'Creating 10-15 targeted searches...');
    
    let multiSearchQueries: any[];
    
    if (isAgentSearch) {
      // Agent-to-Brokerage mode: Find the agent's employer
      console.log('[EnhancedScraper] Using AGENT-TO-BROKERAGE search mode');
      updateProgress('Generating search strategy', 'Finding agent brokerage affiliation...');
      multiSearchQueries = generateAgentToBrokerageQueries({
        name: input.name!,
        phone: input.phone,
        email: input.email,
        city: input.city,
        state: input.state
      });
    } else {
      // Brokerage-to-Agents mode: Find agents at the brokerage
      console.log('[EnhancedScraper] Using BROKERAGE-TO-AGENTS search mode');
      updateProgress('Generating search strategy', 'Finding brokerage agents...');
      const searchInput: SearchInput = {
        businessName: input.name,
        phone: input.phone,
        email: input.email,
        city: input.city,
        state: input.state,
        website: input.website
      };
      multiSearchQueries = generateSearchQueries(searchInput);
    }
    
    console.log(`[EnhancedScraper] Generated ${multiSearchQueries.length} targeted searches`);
    updateProgress('Generating search strategy', `Generated ${multiSearchQueries.length} search strategies`);
    
    // Step 3: Execute parallel searches with progress tracking
    updateProgress('Executing searches', 'Running searches across Brave and DuckDuckGo...');
    const parallelResults = await executeParallelSearches(
      multiSearchQueries,
      (completed, total, currentQuery) => {
        updateProgress('Executing searches', `${completed}/${total}: ${currentQuery.slice(0, 50)}...`);
      }
    );
    console.log(`[EnhancedScraper] Completed ${parallelResults.length} searches`);
    updateProgress('Executing searches', `Completed ${parallelResults.length} searches`);
    
    // Step 4: Analyze results based on search mode
    let hierarchicalRelationship: any = null;
    let analyzedIntel: any = null;
    let crossReferenced: any = null;
    let uniqueContacts: any[] = [];
    
    if (isAgentSearch) {
      // Agent-to-Brokerage analysis: Extract hierarchical relationship
      updateProgress('Analyzing results', 'Extracting agent → team → brokerage relationships...');
      hierarchicalRelationship = await analyzeHierarchicalRelationship(parallelResults, {
        name: input.name!,
        phone: input.phone,
        email: input.email
      });
      console.log(`[EnhancedScraper] Hierarchical analysis complete:`);
      console.log(`  Agent: ${hierarchicalRelationship.agent.name}`);
      console.log(`  Team: ${hierarchicalRelationship.team?.name || 'None'}`);
      console.log(`  Brokerage: ${hierarchicalRelationship.brokerage.name}`);
      updateProgress('Analyzing results', `Found: ${hierarchicalRelationship.brokerage.name}`);
    } else {
      // Brokerage-to-Agents analysis: Extract decision-makers
      updateProgress('Analyzing results', 'Using AI to extract structured intelligence...');
      analyzedIntel = await analyzeSearchResults(parallelResults, {
        businessName: input.name,
        phone: input.phone,
        email: input.email
      });
      console.log(`[EnhancedScraper] AI analysis complete: ${analyzedIntel.decisionMakers.length} decision-makers found`);
      updateProgress('Analyzing results', `Found ${analyzedIntel.decisionMakers.length} decision-makers`);
      
      // Step 5: Cross-reference data for validation
      updateProgress('Cross-referencing data', 'Validating data across multiple sources...');
      crossReferenced = crossReferenceData(analyzedIntel, parallelResults);
      console.log(`[EnhancedScraper] Cross-reference complete: ${crossReferenced.overallConfidence}% confidence`);
      updateProgress('Cross-referencing data', `Validation complete: ${crossReferenced.overallConfidence}% confidence`);
      
      // Step 6: Deduplicate contacts
      uniqueContacts = deduplicateContacts(crossReferenced.decisionMakers);
      console.log(`[EnhancedScraper] Deduplicated to ${uniqueContacts.length} unique contacts`);
    }
    
    // Use cross-referenced data if multi-search succeeded
    let enrichedData: any;
    let searchResults: any[] = [];
    
    if (isAgentSearch && hierarchicalRelationship) {
      // Agent-to-Brokerage mode: Return brokerage as main business with agent as contact
      console.log('[EnhancedScraper] Using hierarchical relationship data');
      enrichedData = {
        name: hierarchicalRelationship.brokerage.name,
        phone: hierarchicalRelationship.brokerage.phone,
        email: hierarchicalRelationship.brokerage.email,
        website: hierarchicalRelationship.brokerage.website,
        address: hierarchicalRelationship.brokerage.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        contacts: [{
          name: hierarchicalRelationship.agent.name,
          role: hierarchicalRelationship.agent.title || hierarchicalRelationship.agent.role,
          title: hierarchicalRelationship.agent.title,
          email: hierarchicalRelationship.agent.email,
          phone: hierarchicalRelationship.agent.phone,
          linkedinUrl: hierarchicalRelationship.agent.linkedinUrl,
          decisionMakerScore: hierarchicalRelationship.agent.confidence,
          approachOrder: 1,
          teamName: hierarchicalRelationship.team?.name,
          teamRole: hierarchicalRelationship.team?.role,
        }],
        possiblyRelated: hierarchicalRelationship.possiblyRelated || [],
        confidence: hierarchicalRelationship.overallConfidence,
        dataSources: ['Agent-to-Brokerage Intelligence', 'Brave Search', 'DuckDuckGo', 'Groq AI Analysis'],
      };
      
      // Create mock search result for industry verification
      searchResults = [{
        title: enrichedData.name,
        url: enrichedData.website || '',
        snippet: `Real estate brokerage: ${enrichedData.name}`
      }];
    } else if (parallelResults.length > 0 && uniqueContacts.length > 0) {
      // Brokerage-to-Agents mode: Return brokerage with all agents
      console.log('[EnhancedScraper] Using multi-search cross-referenced data');
      enrichedData = {
        name: crossReferenced.businessName.value || input.name || 'Unknown Business',
        phone: crossReferenced.phone.value,
        email: crossReferenced.email.value,
        website: crossReferenced.website.value,
        address: crossReferenced.address.value,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        contacts: uniqueContacts.map((c, idx) => ({
          name: c.name,
          role: c.title,
          title: c.title,
          email: c.email,
          phone: c.phone,
          linkedinUrl: c.linkedinUrl,
          decisionMakerScore: c.confidence,
          approachOrder: idx + 1,
        })),
        possiblyRelated: [],
        confidence: crossReferenced.overallConfidence,
        dataSources: ['Multi-Search Intelligence Pipeline', 'Brave Search', 'DuckDuckGo', 'Groq AI Analysis'],
      };
      
      // Create mock search result for industry verification
      searchResults = [{
        title: enrichedData.name,
        url: enrichedData.website || '',
        snippet: `Real estate business: ${enrichedData.name}`
      }];
    } else {
      // Fallback to old method if multi-search fails
      console.log('[EnhancedScraper] Multi-search failed, falling back to old method');
      searchResults = await performSearch(queries, input);
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
      enrichedData = enrichDataFromResults(searchResults, input);
    }
    
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
        decisionMakerScore: ic.decisionMakerScore,
        approachOrder: ic.approachOrder,
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
    
    // Step 7: Verify industry (reject non-real-estate businesses)
    updateProgress('Verifying industry', 'Checking if business is real estate related...');
    
    // Quick check for obvious non-real-estate businesses
    if (isObviouslyNotRealEstate(enrichedData.name)) {
      console.log('[EnhancedScraper] Business is obviously not real estate:', enrichedData.name);
      updateProgress('Verifying industry', 'Not a real estate business - search failed');
      return {
        name: enrichedData.name,
        contacts: [],
        mlsAssociations: [],
        dataSources: ['Industry Verification Failed'],
        confidence: 0
      };
    }
    
    // Use Groq for intelligent industry verification (lenient - only reject if confident it's NOT real estate)
    try {
      const industryCheck = await verifyRealEstateIndustry({
        name: enrichedData.name,
        website: enrichedData.website,
        description: searchResults[0]?.snippet,
      });
      
      // Only reject if we're VERY confident it's not real estate (confidence >= 80%)
      if (!industryCheck.isRealEstate && industryCheck.confidence >= 80) {
        console.log('[EnhancedScraper] High-confidence non-real-estate business:', industryCheck.reason);
        updateProgress('Verifying industry', `Not real estate: ${industryCheck.reason}`);
        return {
          name: enrichedData.name,
          contacts: [],
          mlsAssociations: [],
          dataSources: ['Industry Verification Failed'],
          confidence: 0
        };
      }
      
      if (industryCheck.isRealEstate) {
        console.log('[EnhancedScraper] Industry verified:', industryCheck.reason);
        updateProgress('Verifying industry', `Confirmed real estate business (${industryCheck.confidence}% confidence)`);
        
        // Boost confidence if industry is verified with high confidence
        if (industryCheck.confidence >= 80) {
          enrichedData.confidence = Math.min(enrichedData.confidence + 10, 95);
        }
      } else {
        // Low confidence rejection - continue anyway (assume real estate unless proven otherwise)
        console.log('[EnhancedScraper] Uncertain industry classification - continuing anyway');
        updateProgress('Verifying industry', 'Industry uncertain - proceeding with search');
      }
    } catch (error) {
      console.error('[EnhancedScraper] Industry verification failed:', error);
      updateProgress('Verifying industry', 'Verification failed - continuing anyway');
      // Don't fail the entire search if verification fails
    }
    

    // Step 9: Verify with state license database
    if (enrichedData.state && enrichedData.contacts && enrichedData.contacts.length > 0) {
      updateProgress('Verifying licenses', 'Checking state real estate commission...');
      
      for (const contact of enrichedData.contacts.slice(0, 2)) {
        try {
          const licenseResult = await lookupStateLicense(
            contact.name,
            enrichedData.state,
            contact.phone,
            contact.email
          );
          
          if (licenseResult.found) {
            contact.licenseVerified = true;
            contact.licenseStatus = licenseResult.licenseStatus;
            console.log('[EnhancedScraper] License verified for:', contact.name);
          }
        } catch (error) {
          console.log('[EnhancedScraper] License lookup failed for:', contact.name);
        }
      }
    }
    
    // Step 10: Contact-specific enrichment (3-5 searches per contact)
    if (enrichedData.contacts && enrichedData.contacts.length > 0) {
      const topContacts = enrichedData.contacts.slice(0, 3); // Enrich top 3 contacts only
      updateProgress('Enriching contacts', `Deep-diving ${topContacts.length} key contacts...`);
      
      for (let i = 0; i < topContacts.length; i++) {
        const contact = topContacts[i];
        updateProgress('Enriching contacts', `[${i + 1}/${topContacts.length}] Enriching ${contact.name}...`);
        
        try {
          // Generate 3-5 targeted searches for this specific contact
          const enrichmentQueries = generateContactEnrichmentQueries({
            name: contact.name,
            title: contact.title,
            company: enrichedData.name,
            city: enrichedData.city,
            state: enrichedData.state,
            existingEmail: contact.email,
            existingPhone: contact.phone,
            existingLinkedIn: contact.linkedinUrl
          });
          
          console.log(`[EnhancedScraper] Generated ${enrichmentQueries.length} enrichment queries for ${contact.name}`);
          
          // Execute searches for this contact
          const contactSearchResults = await executeParallelSearches(
            enrichmentQueries,
            (completed, total) => {
              updateProgress('Enriching contacts', `[${i + 1}/${topContacts.length}] ${contact.name}: ${completed}/${total} searches`);
            }
          );
          
          // Analyze results to extract contact info
          const contactEnrichment = await analyzeContactEnrichment(contactSearchResults, {
            name: contact.name,
            company: enrichedData.name,
            title: contact.title
          });
          
          // Merge enriched data (only if confidence is high)
          if (contactEnrichment.email && contactEnrichment.emailConfidence >= 70 && !contact.email) {
            contact.email = contactEnrichment.email;
            console.log(`[EnhancedScraper] Found email for ${contact.name}: ${contactEnrichment.email}`);
          }
          if (contactEnrichment.phone && contactEnrichment.phoneConfidence >= 70 && !contact.phone) {
            contact.phone = contactEnrichment.phone;
            console.log(`[EnhancedScraper] Found phone for ${contact.name}: ${contactEnrichment.phone}`);
          }
          if (contactEnrichment.linkedinUrl && contactEnrichment.linkedinConfidence >= 70 && !contact.linkedinUrl) {
            contact.linkedinUrl = contactEnrichment.linkedinUrl;
            console.log(`[EnhancedScraper] Found LinkedIn for ${contact.name}`);
          }
          
          const enrichmentScore = scoreEnrichment(contactEnrichment);
          console.log(`[EnhancedScraper] Enrichment score for ${contact.name}: ${enrichmentScore}`);
          
        } catch (error: any) {
          console.error(`[EnhancedScraper] Enrichment failed for ${contact.name}:`, error.message);
        }
      }
      
      console.log('[EnhancedScraper] Contact-specific enrichment complete');
      updateProgress('Enriching contacts', 'Enrichment complete');
    }

    // Step 8: Analyze technology stack
    updateProgress('Analyzing technology stack', 'Detecting CRM and transaction management platforms...');
    
    let technologyStack: TechnologyStackProfile | null = null;
    try {
      technologyStack = await analyzeBrokerageTechnologyStack(
        enrichedData.website,
        [] // Job postings would be gathered separately
      );
      
      console.log('[EnhancedScraper] Technology stack analysis complete');
      console.log('[EnhancedScraper] Detected technologies:', technologyStack.topTechnologies);
      updateProgress('Analyzing technology stack', `Found ${technologyStack.topTechnologies.length} technologies`);
    } catch (error) {
      console.error('[EnhancedScraper] Technology stack analysis failed:', error);
      updateProgress('Analyzing technology stack', 'Analysis failed - continuing');
    }
    
    // Step 9: Analyze business intelligence
    updateProgress('Analyzing business intelligence', 'Extracting pain points and insights...');
    
    let businessIntel: any = null;
    try {
      businessIntel = await analyzeBusinessIntelligence({
        name: enrichedData.name,
        website: enrichedData.website,
        description: searchResults[0]?.snippet,
        state: enrichedData.state,
        contacts: enrichedData.contacts?.map((c: any) => ({
          name: c.name,
          title: c.title
        }))
      });
      
      console.log('[EnhancedScraper] Business intelligence gathered');
      updateProgress('Analyzing business intelligence', 'Analysis complete');
    } catch (error) {
      console.error('[EnhancedScraper] Business intelligence analysis failed:', error);
      updateProgress('Analyzing business intelligence', 'Analysis failed - continuing');
    }
    
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
      confidence: enrichedData.confidence || 0,
      technologyStack: technologyStack || undefined
    };

    console.log(`[EnhancedScraper] Scraping complete. Confidence: ${finalData.confidence}%`);
    updateProgress('Finalizing results', 'Search complete!');
    
    return finalData;
  } catch (error) {
    console.error('[EnhancedScraper] Critical error:', error);
    throw error;
  }
}
