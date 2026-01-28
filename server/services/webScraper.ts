/**
 * Comprehensive Web Scraping Service
 * 
 * This service orchestrates data collection from multiple sources:
 * 1. NAR directory (official real estate association data)
 * 2. Google search results (find brokerage websites)
 * 3. Brokerage websites (extract contact info, team pages)
 * 4. LinkedIn (company and employee profiles)
 * 5. Social media (Facebook business pages, Twitter)
 * 6. Public directories (Yellow Pages, Yelp, etc.)
 */

import { enrichBusinessFromLinkedIn, searchBusinessMultiSource } from "./dataEnrichment";
import { searchNAROffices, getNAROfficeDetails, type NAROfficeResult } from "./narScraper";

export interface ScrapedContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  source: string;
  confidence: number;
}

export interface ScrapedBusiness {
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
  contacts: ScrapedContact[];
  mlsAssociations: Array<{
    name: string;
    type: "state" | "local";
    source: string;
  }>;
  sources: string[];
  overallConfidence: number;
}

/**
 * Main orchestrator: scrape all available sources for a business
 */
export async function scrapeBusinessComprehensive(params: {
  name?: string;
  website?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
}): Promise<ScrapedBusiness> {
  const sources: string[] = [];
  const contacts: ScrapedContact[] = [];
  const mlsAssociations: Array<{ name: string; type: "state" | "local"; source: string }> = [];
  
  let businessData: Partial<ScrapedBusiness> = {
    name: params.name || "Unknown",
    website: params.website,
    phone: params.phone,
    email: params.email,
    city: params.city,
    state: params.state,
  };

  // Source 1: NAR Directory
  if (params.name) {
    const narResults = await scrapeFromNAR({
      name: params.name,
      city: params.city,
      state: params.state,
    });
    
    if (narResults) {
      sources.push("NAR Directory");
      businessData = mergeBusinessData(businessData, narResults.business);
      contacts.push(...narResults.contacts);
      mlsAssociations.push(...narResults.mlsAssociations);
    }
  }

  // Source 2: LinkedIn
  if (params.name) {
    const linkedInResult = await enrichBusinessFromLinkedIn(params.name);
    if (linkedInResult.success && linkedInResult.data) {
      sources.push("LinkedIn");
      businessData = mergeBusinessData(businessData, {
        website: linkedInResult.data.website,
        phone: linkedInResult.data.phone,
        description: linkedInResult.data.description,
      });
    }
  }

  // Source 3: Google Search + Website Scraping
  if (params.name) {
    const webResults = await scrapeFromWeb({
      businessName: params.name,
      city: params.city,
      state: params.state,
    });
    
    if (webResults) {
      sources.push("Web Search");
      businessData = mergeBusinessData(businessData, webResults.business);
      contacts.push(...webResults.contacts);
    }
  }

  // Source 4: Social Media
  if (params.name) {
    const socialResults = await scrapeFromSocialMedia({
      businessName: params.name,
      city: params.city,
      state: params.state,
    });
    
    if (socialResults) {
      sources.push("Social Media");
      contacts.push(...socialResults.contacts);
    }
  }

  // Calculate overall confidence based on source agreement
  const overallConfidence = calculateOverallConfidence({
    sources,
    dataPoints: businessData,
  });

  return {
    name: businessData.name || "Unknown",
    website: businessData.website,
    phone: businessData.phone,
    email: businessData.email,
    address: businessData.address,
    city: businessData.city,
    state: businessData.state,
    zipCode: businessData.zipCode,
    description: businessData.description,
    contacts: deduplicateContacts(contacts),
    mlsAssociations,
    sources,
    overallConfidence,
  };
}

/**
 * Scrape NAR directory
 */
async function scrapeFromNAR(params: {
  name: string;
  city?: string;
  state?: string;
}): Promise<{
  business: Partial<ScrapedBusiness>;
  contacts: ScrapedContact[];
  mlsAssociations: Array<{ name: string; type: "state" | "local"; source: string }>;
} | null> {
  try {
    const narResults = await searchNAROffices({
      officeName: params.name,
      city: params.city,
      state: params.state,
    });

    if (narResults.length === 0) {
      return null;
    }

    // Get detailed info for the first match
    const firstResult = narResults[0];
    const detailedInfo = firstResult.officeId
      ? await getNAROfficeDetails(firstResult.officeId)
      : firstResult;

    if (!detailedInfo) {
      return null;
    }

    const contacts: ScrapedContact[] = [];
    const mlsAssociations: Array<{ name: string; type: "state" | "local"; source: string }> = [];

    // Extract designated realtor (broker/owner)
    if (detailedInfo.designatedRealtor) {
      contacts.push({
        name: detailedInfo.designatedRealtor,
        title: "Designated Realtor / Broker",
        phone: detailedInfo.phone,
        source: "NAR Directory",
        confidence: 0.95,
      });
    }

    // Extract office contact manager (technology POC)
    if (detailedInfo.officeContactManager && detailedInfo.officeContactManager !== detailedInfo.designatedRealtor) {
      contacts.push({
        name: detailedInfo.officeContactManager,
        title: "Office Contact Manager",
        phone: detailedInfo.phone,
        source: "NAR Directory",
        confidence: 0.9,
      });
    }

    // Extract MLS associations
    if (detailedInfo.stateAssociation) {
      mlsAssociations.push({
        name: detailedInfo.stateAssociation,
        type: "state",
        source: "NAR Directory",
      });
    }

    if (detailedInfo.localAssociation) {
      mlsAssociations.push({
        name: detailedInfo.localAssociation,
        type: "local",
        source: "NAR Directory",
      });
    }

    return {
      business: {
        name: detailedInfo.officeName,
        phone: detailedInfo.phone,
        address: detailedInfo.address,
        city: detailedInfo.city,
        state: detailedInfo.state,
        zipCode: detailedInfo.zipCode,
      },
      contacts,
      mlsAssociations,
    };
  } catch (error) {
    console.error("NAR scraping error:", error);
    return null;
  }
}

/**
 * Scrape from web search and brokerage websites
 */
async function scrapeFromWeb(params: {
  businessName: string;
  city?: string;
  state?: string;
}): Promise<{
  business: Partial<ScrapedBusiness>;
  contacts: ScrapedContact[];
} | null> {
  // In production, this would:
  // 1. Perform Google search for "{businessName} {city} {state} real estate"
  // 2. Extract the brokerage's official website from results
  // 3. Scrape the website for:
  //    - Contact page (phone, email, address)
  //    - About page (description, history)
  //    - Team/Staff page (broker, agents, office manager)
  //    - Leadership page (owner, principal broker)
  // 4. Look for common patterns:
  //    - Email formats: contact@, info@, [name]@domain.com
  //    - Phone in footer or header
  //    - Staff directory with titles
  
  console.log("Web scraping for:", params);
  
  // Mock implementation
  return null;
}

/**
 * Scrape from social media platforms
 */
async function scrapeFromSocialMedia(params: {
  businessName: string;
  city?: string;
  state?: string;
}): Promise<{
  contacts: ScrapedContact[];
} | null> {
  // In production, this would:
  // 1. Search Facebook for business page
  // 2. Extract employees from LinkedIn company page
  // 3. Find Twitter/X business profile
  // 4. Look for Instagram business account
  // 5. Extract contact information and key personnel
  
  console.log("Social media scraping for:", params);
  
  // Mock implementation
  return null;
}

/**
 * Merge business data from multiple sources
 */
function mergeBusinessData(
  existing: Partial<ScrapedBusiness>,
  newData: Partial<ScrapedBusiness>
): Partial<ScrapedBusiness> {
  return {
    name: existing.name || newData.name,
    website: existing.website || newData.website,
    phone: existing.phone || newData.phone,
    email: existing.email || newData.email,
    address: existing.address || newData.address,
    city: existing.city || newData.city,
    state: existing.state || newData.state,
    zipCode: existing.zipCode || newData.zipCode,
    description: existing.description || newData.description,
  };
}

/**
 * Deduplicate contacts using name matching
 */
function deduplicateContacts(contacts: ScrapedContact[]): ScrapedContact[] {
  const seen = new Map<string, ScrapedContact>();
  
  for (const contact of contacts) {
    const key = contact.name.toLowerCase().trim();
    const existing = seen.get(key);
    
    if (!existing || contact.confidence > existing.confidence) {
      // Merge data if we have an existing contact
      if (existing) {
        contact.email = contact.email || existing.email;
        contact.phone = contact.phone || existing.phone;
        contact.title = contact.title || existing.title;
        contact.linkedinUrl = contact.linkedinUrl || existing.linkedinUrl;
      }
      seen.set(key, contact);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Calculate overall confidence based on source agreement
 */
function calculateOverallConfidence(params: {
  sources: string[];
  dataPoints: Partial<ScrapedBusiness>;
}): number {
  const { sources, dataPoints } = params;
  
  // Base confidence on number of sources
  let confidence = Math.min(sources.length * 0.25, 1.0);
  
  // Boost confidence if we have key data points
  const keyFields = ["phone", "website", "address"];
  const filledFields = keyFields.filter(field => dataPoints[field as keyof ScrapedBusiness]);
  confidence += (filledFields.length / keyFields.length) * 0.2;
  
  return Math.min(confidence, 1.0);
}

/**
 * Extract emails from text content
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

/**
 * Extract phone numbers from text content
 */
export function extractPhones(text: string): string[] {
  const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  return text.match(phoneRegex) || [];
}

/**
 * Extract addresses from text content
 */
export function extractAddresses(text: string): string[] {
  // Simple pattern for US addresses
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}/gi;
  return text.match(addressRegex) || [];
}
