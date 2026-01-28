import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Direct web scraping using axios + cheerio
 * No external APIs required - completely free
 */

// User agents to rotate and avoid blocking
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Search Google for business information
 */
export async function searchGoogle(query: string): Promise<Array<{
  title: string;
  url: string;
  snippet: string;
}>> {
  try {
    console.log(`[DirectWebScraper] Searching Google for: ${query}`);
    
    const response = await axios.get('https://www.google.com/search', {
      params: { q: query },
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: Array<{ title: string; url: string; snippet: string }> = [];

    // Parse Google search results
    $('.g').each((_, element) => {
      const $element = $(element);
      const titleElement = $element.find('h3').first();
      const linkElement = $element.find('a').first();
      const snippetElement = $element.find('.VwiC3b, .yXK7lf, .lEBKkf').first();

      const title = titleElement.text().trim();
      const url = linkElement.attr('href') || '';
      const snippet = snippetElement.text().trim();

      if (title && url && url.startsWith('http')) {
        results.push({ title, url, snippet });
      }
    });

    console.log(`[DirectWebScraper] Found ${results.length} Google results`);
    return results.slice(0, 10); // Return top 10 results
  } catch (error) {
    console.error('[DirectWebScraper] Google search failed:', error);
    return [];
  }
}

/**
 * Extract contact information from text
 */
function extractContactInfo(text: string): {
  emails: string[];
  phones: string[];
} {
  const emails: string[] = [];
  const phones: string[] = [];

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = text.match(emailRegex);
  if (emailMatches) {
    emails.push(...emailMatches);
  }

  // Phone regex (various formats)
  const phoneRegex = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches) {
    phones.push(...phoneMatches.map(p => p.trim()));
  }

  return {
    emails: Array.from(new Set(emails)), // Remove duplicates
    phones: Array.from(new Set(phones)),
  };
}

/**
 * Scrape a website for contact information
 */
export async function scrapeWebsite(url: string): Promise<{
  emails: string[];
  phones: string[];
  text: string;
}> {
  try {
    console.log(`[DirectWebScraper] Scraping website: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
      timeout: 10000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, noscript').remove();
    
    // Get all text content
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Extract contact info
    const contactInfo = extractContactInfo(text);
    
    console.log(`[DirectWebScraper] Found ${contactInfo.emails.length} emails, ${contactInfo.phones.length} phones`);
    
    return {
      ...contactInfo,
      text: text.substring(0, 5000), // Limit text to 5000 chars
    };
  } catch (error) {
    console.error(`[DirectWebScraper] Failed to scrape ${url}:`, error);
    return { emails: [], phones: [], text: '' };
  }
}

/**
 * Extract contact names from text using simple heuristics
 */
export function extractContactNames(text: string): string[] {
  const names: string[] = [];
  
  // Look for common patterns like "Contact: John Doe" or "John Doe, Broker"
  const patterns = [
    /(?:Contact|Name|Owner|Broker|Manager|Principal):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
    /([A-Z][a-z]+\s+[A-Z][a-z]+),\s*(?:Broker|Owner|Manager|Principal|CEO|President)/g,
  ];
  
  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        names.push(match[1].trim());
      }
    }
  }
  
  return Array.from(new Set(names)).slice(0, 5); // Return up to 5 unique names
}

/**
 * Main scraping function - combines Google search + website scraping
 */
export async function scrapeBusinessInfo(businessName: string, location?: string): Promise<{
  name: string;
  website?: string;
  emails: string[];
  phones: string[];
  contactNames: string[];
  address?: string;
  city?: string;
  state?: string;
}> {
  try {
    // Build search query
    const query = location 
      ? `${businessName} ${location} real estate contact`
      : `${businessName} real estate contact`;
    
    // Search Google
    const searchResults = await searchGoogle(query);
    
    if (searchResults.length === 0) {
      console.log('[DirectWebScraper] No search results found');
      return {
        name: businessName,
        emails: [],
        phones: [],
        contactNames: [],
      };
    }
    
    // Get the first result (most likely the business website)
    const topResult = searchResults[0];
    
    // Scrape the website
    const websiteData = await scrapeWebsite(topResult.url);
    
    // Extract contact names from the scraped text
    const contactNames = extractContactNames(websiteData.text);
    
    // Combine data from search snippet and website
    const snippetContactInfo = extractContactInfo(topResult.snippet);
    
    const allEmails = Array.from(new Set([...snippetContactInfo.emails, ...websiteData.emails]));
    const allPhones = Array.from(new Set([...snippetContactInfo.phones, ...websiteData.phones]));
    
    console.log(`[DirectWebScraper] Scraping complete: ${allEmails.length} emails, ${allPhones.length} phones, ${contactNames.length} names`);
    
    return {
      name: topResult.title.split('|')[0].split('-')[0].trim() || businessName,
      website: topResult.url,
      emails: allEmails,
      phones: allPhones,
      contactNames,
      city: location?.split(',')[0]?.trim(),
      state: location?.split(',')[1]?.trim(),
    };
  } catch (error) {
    console.error('[DirectWebScraper] Scraping failed:', error);
    return {
      name: businessName,
      emails: [],
      phones: [],
      contactNames: [],
    };
  }
}
