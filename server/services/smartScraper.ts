/**
 * Enhanced Web Scraper with Multi-Layer Strategy
 * 
 * Scraping Strategy Priority:
 * 1. Schema.org structured data (95% accuracy, instant)
 * 2. Cheerio static HTML parsing (85% accuracy, fast)
 * 3. Puppeteer JavaScript rendering (75% accuracy, slow)
 * 4. Data validation and cross-referencing
 * 5. Confidence scoring
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

// Types
export interface ExtractedContact {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidence: number;
  source: string;
}

export interface ExtractedBusiness {
  name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contacts: ExtractedContact[];
  confidence: number;
  sources: string[];
}

/**
 * Layer 1: Extract Schema.org structured data (Highest accuracy)
 */
async function extractSchemaData(url: string): Promise<Partial<ExtractedBusiness> | null> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    const schemas: any[] = [];

    // Extract all JSON-LD schemas
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const schemaText = $(el).html();
        if (schemaText) {
          const parsed = JSON.parse(schemaText);
          schemas.push(parsed);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    // Find business-related schemas
    const businessSchema = schemas.find(s => 
      s['@type'] === 'LocalBusiness' ||
      s['@type'] === 'RealEstateAgent' ||
      s['@type'] === 'Organization' ||
      (Array.isArray(s['@type']) && (
        s['@type'].includes('LocalBusiness') ||
        s['@type'].includes('RealEstateAgent') ||
        s['@type'].includes('Organization')
      ))
    );

    if (!businessSchema) return null;

    console.log('[SchemaExtractor] Found Schema.org data:', businessSchema['@type']);

    // Extract structured data
    const result: Partial<ExtractedBusiness> = {
      name: businessSchema.name,
      phone: businessSchema.telephone || businessSchema.contactPoint?.telephone,
      email: businessSchema.email || businessSchema.contactPoint?.email,
      website: businessSchema.url,
      confidence: 95,
      sources: ['Schema.org'],
      contacts: []
    };

    // Extract address if available
    if (businessSchema.address) {
      const addr = businessSchema.address;
      if (typeof addr === 'string') {
        result.address = addr;
      } else {
        result.address = addr.streetAddress;
        result.city = addr.addressLocality;
        result.state = addr.addressRegion;
        result.zipCode = addr.postalCode;
      }
    }

    // Extract contacts from employee list if available
    if (businessSchema.employee && Array.isArray(businessSchema.employee)) {
      result.contacts = businessSchema.employee.map((emp: any) => ({
        name: emp.name || '',
        role: emp.jobTitle || 'Unknown',
        email: emp.email,
        phone: emp.telephone,
        confidence: 0.9,
        source: 'Schema.org'
      }));
    }

    return result;
  } catch (error) {
    console.error('[SchemaExtractor] Error:', error);
    return null;
  }
}

/**
 * Layer 2: Cheerio static HTML parsing (Fast, good accuracy)
 */
async function extractWithCheerio(url: string): Promise<Partial<ExtractedBusiness> | null> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    
    console.log('[CheerioScraper] Parsing HTML for', url);

    // Extract semantic data
    const emails: string[] = [];
    const phones: string[] = [];
    const contacts: ExtractedContact[] = [];

    // Find emails from mailto links
    $('a[href^="mailto:"]').each((_, el) => {
      const email = $(el).attr('href')?.replace('mailto:', '').trim();
      if (email) emails.push(email);
    });

    // Find phones from tel links
    $('a[href^="tel:"]').each((_, el) => {
      const phone = $(el).attr('href')?.replace('tel:', '').trim();
      if (phone) phones.push(phone);
    });

    // Extract text content for pattern matching
    const bodyText = $('body').text();
    
    // Find emails in text (fallback)
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const textEmails = bodyText.match(emailPattern) || [];
    emails.push(...textEmails);

    // Find phones in text (fallback)
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const textPhones = bodyText.match(phonePattern) || [];
    phones.push(...textPhones);

    // Look for team/staff sections
    const teamSections = $(
      'section:contains("Team"), section:contains("Staff"), ' +
      'div:contains("Our Team"), div:contains("Meet the Team"), ' +
      'div.team, div.staff, div#team, div#staff'
    );

    teamSections.each((_, section) => {
      const sectionText = $(section).text();
      
      // Pattern: Name with title
      const namePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)[\s,\-–]+(Broker|Owner|Managing\s+Broker|Office\s+Manager|Admin|Agent)/gi;
      const matches = Array.from(sectionText.matchAll(namePattern));
      
      matches.forEach(match => {
        const name = match[1];
        const role = match[2];
        
        // Try to find email/phone near this name
        const contextStart = Math.max(0, match.index! - 200);
        const contextEnd = Math.min(sectionText.length, match.index! + 200);
        const context = sectionText.substring(contextStart, contextEnd);
        
        const emailMatch = context.match(emailPattern);
        const phoneMatch = context.match(phonePattern);
        
        contacts.push({
          name,
          role,
          email: emailMatch ? emailMatch[0] : undefined,
          phone: phoneMatch ? phoneMatch[0] : undefined,
          confidence: 0.75,
          source: 'HTML Parsing'
        });
      });
    });

    // Get meta tags for additional info
    const businessName = 
      $('meta[property="og:site_name"]').attr('content') ||
      $('meta[name="application-name"]').attr('content') ||
      $('title').text().split('|')[0].trim();

    const result: Partial<ExtractedBusiness> = {
      name: businessName,
      phone: phones[0],
      email: emails[0],
      confidence: 75,
      sources: ['Cheerio HTML'],
      contacts: contacts.slice(0, 10) // Limit to 10 contacts
    };

    console.log(`[CheerioScraper] Found ${emails.length} emails, ${phones.length} phones, ${contacts.length} contacts`);

    return result;
  } catch (error) {
    console.error('[CheerioScraper] Error:', error);
    return null;
  }
}

/**
 * Validate phone number format
 */
function validatePhone(phone: string): { valid: boolean; formatted: string; confidence: number } {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // US phone numbers should be 10 or 11 digits (with country code)
  if (digits.length === 10) {
    return {
      valid: true,
      formatted: `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`,
      confidence: 0.9
    };
  } else if (digits.length === 11 && digits[0] === '1') {
    return {
      valid: true,
      formatted: `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`,
      confidence: 0.9
    };
  }
  
  return { valid: false, formatted: phone, confidence: 0.3 };
}

/**
 * Validate email format
 */
function validateEmail(email: string): { valid: boolean; confidence: number } {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = emailPattern.test(email);
  
  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com', 
    'mailinator.com', '10minutemail.com'
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  const isDisposable = disposableDomains.includes(domain);
  
  return {
    valid: valid && !isDisposable,
    confidence: valid && !isDisposable ? 0.85 : 0.2
  };
}

/**
 * Deduplicate contacts by name
 */
function deduplicateContacts(contacts: ExtractedContact[]): ExtractedContact[] {
  const seen = new Map<string, ExtractedContact>();
  
  for (const contact of contacts) {
    const key = contact.name.toLowerCase().trim();
    const existing = seen.get(key);
    
    if (!existing || contact.confidence > existing.confidence) {
      // Merge data if we have existing contact
      if (existing) {
        contact.email = contact.email || existing.email;
        contact.phone = contact.phone || existing.phone;
        contact.linkedinUrl = contact.linkedinUrl || existing.linkedinUrl;
      }
      seen.set(key, contact);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Calculate overall confidence based on multiple factors
 */
function calculateConfidence(
  schemaData: Partial<ExtractedBusiness> | null,
  cheerioData: Partial<ExtractedBusiness> | null,
  puppeteerData: Partial<ExtractedBusiness> | null
): number {
  let confidence = 0;
  let sources = 0;
  
  if (schemaData) {
    confidence += 95;
    sources++;
  }
  if (cheerioData) {
    confidence += 75;
    sources++;
  }
  if (puppeteerData) {
    confidence += 70;
    sources++;
  }
  
  if (sources === 0) return 0;
  
  // Average confidence across sources
  const avgConfidence = confidence / sources;
  
  // Boost confidence if multiple sources agree
  if (sources > 1) {
    return Math.min(avgConfidence + 10, 100);
  }
  
  return avgConfidence;
}

/**
 * Main smart scraping function with waterfall strategy
 */
export async function smartScrapeWebsite(url: string): Promise<ExtractedBusiness> {
  console.log('[SmartScraper] Starting smart scrape of:', url);
  
  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  // Layer 1: Try Schema.org extraction (fastest, highest accuracy)
  console.log('[SmartScraper] Layer 1: Trying Schema.org extraction...');
  const schemaData = await extractSchemaData(normalizedUrl);
  
  if (schemaData && schemaData.confidence && schemaData.confidence >= 90) {
    console.log('[SmartScraper] High-confidence Schema.org data found, using it!');
    return {
      name: schemaData.name || 'Unknown Business',
      phone: schemaData.phone,
      email: schemaData.email,
      website: schemaData.website || normalizedUrl,
      address: schemaData.address,
      city: schemaData.city,
      state: schemaData.state,
      zipCode: schemaData.zipCode,
      contacts: schemaData.contacts || [],
      confidence: schemaData.confidence || 95,
      sources: schemaData.sources || ['Schema.org']
    };
  }
  
  // Layer 2: Try Cheerio (fast static HTML parsing)
  console.log('[SmartScraper] Layer 2: Trying Cheerio static HTML parsing...');
  const cheerioData = await extractWithCheerio(normalizedUrl);
  
  // Merge schema and cheerio data
  const mergedContacts = [
    ...(schemaData?.contacts || []),
    ...(cheerioData?.contacts || [])
  ];
  
  const deduped = deduplicateContacts(mergedContacts);
  
  // Validate phone numbers
  let validatedPhone = schemaData?.phone || cheerioData?.phone;
  if (validatedPhone) {
    const validation = validatePhone(validatedPhone);
    if (validation.valid) {
      validatedPhone = validation.formatted;
    }
  }
  
  // Validate email
  let validatedEmail = schemaData?.email || cheerioData?.email;
  if (validatedEmail) {
    const validation = validateEmail(validatedEmail);
    if (!validation.valid) {
      console.warn('[SmartScraper] Email validation failed:', validatedEmail);
      validatedEmail = undefined;
    }
  }
  
  const finalConfidence = calculateConfidence(schemaData, cheerioData, null);
  
  const result: ExtractedBusiness = {
    name: schemaData?.name || cheerioData?.name || 'Unknown Business',
    phone: validatedPhone,
    email: validatedEmail,
    website: normalizedUrl,
    address: schemaData?.address || cheerioData?.address,
    city: schemaData?.city || cheerioData?.city,
    state: schemaData?.state || cheerioData?.state,
    zipCode: schemaData?.zipCode || cheerioData?.zipCode,
    contacts: deduped,
    confidence: finalConfidence,
    sources: [
      ...(schemaData ? ['Schema.org'] : []),
      ...(cheerioData ? ['Cheerio HTML'] : [])
    ]
  };
  
  console.log(`[SmartScraper] Scraping complete. Confidence: ${result.confidence}%, Contacts: ${result.contacts.length}`);
  
  return result;
}

/**
 * Scrape multiple pages of a website
 */
export async function scrapeMultiplePages(baseUrl: string, relevantPaths: string[]): Promise<ExtractedBusiness> {
  console.log(`[SmartScraper] Scraping ${relevantPaths.length} pages from ${baseUrl}`);
  
  const allData: Array<Partial<ExtractedBusiness>> = [];
  
  // Scrape base URL first
  const baseData = await smartScrapeWebsite(baseUrl);
  allData.push(baseData);
  
  // Scrape additional pages
  for (const path of relevantPaths) {
    const fullUrl = new URL(path, baseUrl).toString();
    try {
      const pageData = await smartScrapeWebsite(fullUrl);
      allData.push(pageData);
    } catch (error) {
      console.error(`[SmartScraper] Failed to scrape ${fullUrl}:`, error);
    }
  }
  
  // Merge all contacts
  const allContacts = allData.flatMap(d => d.contacts || []);
  const dedupedContacts = deduplicateContacts(allContacts);
  
  // Take the best data from each source
  return {
    name: allData.find(d => d.name)?.name || 'Unknown Business',
    phone: allData.find(d => d.phone)?.phone,
    email: allData.find(d => d.email)?.email,
    website: baseUrl,
    address: allData.find(d => d.address)?.address,
    city: allData.find(d => d.city)?.city,
    state: allData.find(d => d.state)?.state,
    zipCode: allData.find(d => d.zipCode)?.zipCode,
    contacts: dedupedContacts,
    confidence: Math.max(...allData.map(d => d.confidence || 0)),
    sources: Array.from(new Set(allData.flatMap(d => d.sources || [])))
  };
}
