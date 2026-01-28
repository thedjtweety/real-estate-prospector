/**
 * Browser Automation Service for Deep Website Scraping
 * 
 * Uses Puppeteer to visit websites and extract structured contact data
 * from About Us, Team, Contact, and other relevant pages.
 */

import type { Browser, Page } from 'puppeteer';

export interface DeepScrapedData {
  contacts: Array<{
    name: string;
    role: string;
    email?: string;
    phone?: string;
    source: string;
  }>;
  phones: string[];
  emails: string[];
  addresses: string[];
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  about?: string;
}

/**
 * Extract contact information from page text
 */
function extractContactsFromText(text: string, source: string): DeepScrapedData['contacts'] {
  const contacts: DeepScrapedData['contacts'] = [];
  
  // Pattern: Name with title/role
  const patterns = [
    // "John Smith, Broker/Owner" or "John Smith - Broker"
    /([A-Z][a-z]+\s+[A-Z][a-z]+)[\s,\-–]+(?:Broker|Owner|Managing\s+Broker|Principal|CEO|President|Office\s+Manager|Admin|Administrator|Transaction\s+Coordinator|Agent)/gi,
    // "Broker: John Smith"
    /(?:Broker|Owner|Managing\s+Broker|Office\s+Manager|Admin):[\s]*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
  ];
  
  patterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    matches.forEach(match => {
      const fullMatch = match[0];
      const name = match[1];
      
      // Extract role from the match
      let role = 'Unknown';
      if (fullMatch.match(/broker/i)) role = 'Broker';
      if (fullMatch.match(/owner/i)) role = 'Owner';
      if (fullMatch.match(/managing/i)) role = 'Managing Broker';
      if (fullMatch.match(/office\s+manager/i)) role = 'Office Manager';
      if (fullMatch.match(/admin/i)) role = 'Administrator';
      if (fullMatch.match(/transaction\s+coordinator/i)) role = 'Transaction Coordinator';
      if (fullMatch.match(/ceo|president|principal/i)) role = 'Executive';
      
      // Try to find email/phone near this name
      const contextStart = Math.max(0, match.index! - 200);
      const contextEnd = Math.min(text.length, match.index! + 200);
      const context = text.substring(contextStart, contextEnd);
      
      const emailMatch = context.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = context.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      
      contacts.push({
        name,
        role,
        email: emailMatch ? emailMatch[0] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        source
      });
    });
  });
  
  return contacts;
}

/**
 * Extract all emails from text
 */
function extractEmails(text: string): string[] {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailPattern);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Extract all phone numbers from text
 */
function extractPhones(text: string): string[] {
  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phonePattern);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Extract addresses from text
 */
function extractAddresses(text: string): string[] {
  const addressPattern = /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|suite|ste|#)\s*\d*/gi;
  const matches = text.match(addressPattern);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Find relevant page links (About, Team, Contact, etc.)
 */
async function findRelevantLinks(page: Page): Promise<string[]> {
  try {
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .map(a => ({
          href: (a as HTMLAnchorElement).href,
          text: a.textContent?.toLowerCase() || ''
        }))
        .filter(link => {
          const relevantKeywords = [
            'about', 'team', 'contact', 'staff', 'our team',
            'leadership', 'management', 'agents', 'brokers',
            'meet the team', 'who we are'
          ];
          return relevantKeywords.some(keyword => 
            link.text.includes(keyword) || link.href.toLowerCase().includes(keyword)
          );
        })
        .map(link => link.href);
    });
    
    // Remove duplicates and limit to 5 most relevant pages
    return Array.from(new Set(links)).slice(0, 5);
  } catch (error) {
    console.error('[BrowserScraper] Error finding links:', error);
    return [];
  }
}

/**
 * Scrape a single page for contact information
 */
async function scrapePage(page: Page, url: string): Promise<Partial<DeepScrapedData>> {
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    // Get all text content
    const text = await page.evaluate(() => document.body.innerText);
    
    // Extract social media links
    const socialLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const social: any = {};
      
      links.forEach(a => {
        const href = (a as HTMLAnchorElement).href;
        if (href.includes('linkedin.com')) social.linkedin = href;
        if (href.includes('facebook.com')) social.facebook = href;
        if (href.includes('twitter.com') || href.includes('x.com')) social.twitter = href;
      });
      
      return social;
    });
    
    return {
      contacts: extractContactsFromText(text, url),
      emails: extractEmails(text),
      phones: extractPhones(text),
      addresses: extractAddresses(text),
      socialLinks,
      about: text.substring(0, 500) // First 500 chars for context
    };
  } catch (error) {
    console.error(`[BrowserScraper] Error scraping ${url}:`, error);
    return {
      contacts: [],
      emails: [],
      phones: [],
      addresses: [],
      socialLinks: {}
    };
  }
}

/**
 * Deep scrape a website for comprehensive contact information
 */
export async function deepScrapeWebsite(websiteUrl: string): Promise<DeepScrapedData> {
  let browser: Browser | null = null;
  
  try {
    // Dynamically import puppeteer
    const puppeteer = await import('puppeteer');
    
    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Normalize URL
    const baseUrl = websiteUrl.startsWith('http') 
      ? websiteUrl 
      : `https://${websiteUrl}`;
    
    console.log(`[BrowserScraper] Starting deep scrape of ${baseUrl}`);
    
    // Scrape homepage first
    const homepageData = await scrapePage(page, baseUrl);
    
    // Find and scrape relevant pages
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    const relevantLinks = await findRelevantLinks(page);
    
    console.log(`[BrowserScraper] Found ${relevantLinks.length} relevant pages to scrape`);
    
    // Scrape each relevant page
    const pageDataPromises = relevantLinks.map(link => scrapePage(page, link));
    const pagesData = await Promise.all(pageDataPromises);
    
    // Aggregate all data
    const allContacts = [
      ...(homepageData.contacts || []),
      ...pagesData.flatMap(d => d.contacts || [])
    ];
    
    const allEmails = [
      ...(homepageData.emails || []),
      ...pagesData.flatMap(d => d.emails || [])
    ];
    
    const allPhones = [
      ...(homepageData.phones || []),
      ...pagesData.flatMap(d => d.phones || [])
    ];
    
    const allAddresses = [
      ...(homepageData.addresses || []),
      ...pagesData.flatMap(d => d.addresses || [])
    ];
    
    // Merge social links
    const socialLinks = pagesData.reduce((acc, data) => ({
      ...acc,
      ...data.socialLinks
    }), homepageData.socialLinks || {});
    
    // Deduplicate contacts by name
    const uniqueContacts = Array.from(
      new Map(allContacts.map(c => [c.name.toLowerCase(), c])).values()
    );
    
    const result: DeepScrapedData = {
      contacts: uniqueContacts,
      emails: Array.from(new Set(allEmails)),
      phones: Array.from(new Set(allPhones)),
      addresses: Array.from(new Set(allAddresses)),
      socialLinks,
      about: homepageData.about
    };
    
    console.log(`[BrowserScraper] Deep scrape complete. Found ${result.contacts.length} contacts, ${result.emails.length} emails, ${result.phones.length} phones`);
    
    return result;
    
  } catch (error) {
    console.error('[BrowserScraper] Deep scrape failed:', error);
    return {
      contacts: [],
      emails: [],
      phones: [],
      addresses: [],
      socialLinks: {}
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape NAR directory for a business
 */
export async function scrapeNARDirectory(businessName: string, state?: string): Promise<Partial<DeepScrapedData>> {
  let browser: Browser | null = null;
  
  try {
    const puppeteer = await import('puppeteer');
    
    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to NAR directory
    await page.goto('https://www.nar.realtor/directories', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    // Search for the business
    // Note: This is a simplified version - actual implementation would need
    // to handle the specific NAR directory interface
    const searchQuery = state ? `${businessName} ${state}` : businessName;
    
    // Try to find and fill search input
    try {
      await page.type('input[type="search"], input[name="search"], input[placeholder*="search" i]', searchQuery);
      await page.keyboard.press('Enter');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    } catch (error) {
      console.warn('[BrowserScraper] Could not interact with NAR search');
    }
    
    // Extract results
    const text = await page.evaluate(() => document.body.innerText);
    
    return {
      contacts: extractContactsFromText(text, 'NAR Directory'),
      emails: extractEmails(text),
      phones: extractPhones(text),
      addresses: extractAddresses(text)
    };
    
  } catch (error) {
    console.error('[BrowserScraper] NAR scrape failed:', error);
    return {
      contacts: [],
      emails: [],
      phones: [],
      addresses: []
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
