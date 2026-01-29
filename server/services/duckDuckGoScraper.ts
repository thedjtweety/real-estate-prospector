import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * DuckDuckGo HTML Scraping
 * Completely free, unlimited searches
 * No API key required
 * Use as fallback when Brave API hits rate limit
 */

export interface DDGSearchResult {
  title: string;
  url: string;
  snippet: string;
  description: string; // Same as snippet for compatibility
}

// User agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Search DuckDuckGo HTML interface (no API key needed)
 */
export async function searchDuckDuckGo(query: string): Promise<DDGSearchResult[]> {
  try {
    console.log(`[DuckDuckGo] Searching for: ${query}`);
    
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: {
        q: query,
      },
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results: DDGSearchResult[] = [];

    // Parse DuckDuckGo search results
    $('.result').each((_, element) => {
      const $element = $(element);
      
      // Extract title
      const titleElement = $element.find('.result__title');
      const title = titleElement.text().trim();
      
      // Extract URL (DuckDuckGo uses redirect URLs, need to extract actual URL)
      const linkElement = $element.find('.result__a');
      let url = linkElement.attr('href') || '';
      
      // DuckDuckGo URLs are in format: //duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com
      if (url.includes('uddg=')) {
        try {
          const urlMatch = url.match(/uddg=([^&]+)/);
          if (urlMatch && urlMatch[1]) {
            url = decodeURIComponent(urlMatch[1]);
          }
        } catch (e) {
          // If decoding fails, skip this result
        }
      }
      
      // Extract snippet
      const snippetElement = $element.find('.result__snippet');
      const snippet = snippetElement.text().trim();
      
      // Only add if we have valid data
      if (title && url && url.startsWith('http')) {
        results.push({
          title,
          url,
          snippet,
          description: snippet, // Same as snippet for compatibility
        });
      }
    });

    console.log(`[DuckDuckGo] Found ${results.length} results`);
    return results.slice(0, 10); // Return top 10
    
  } catch (error: any) {
    console.error('[DuckDuckGo] Search failed:', error.message);
    return [];
  }
}

/**
 * Search for business information using DuckDuckGo
 */
export async function searchBusinessDDG(
  businessName: string,
  location?: string,
  phone?: string
): Promise<DDGSearchResult[]> {
  // Build intelligent search query
  let query = businessName;
  
  if (phone) {
    // Phone-first search (most specific)
    query = `"${phone}" real estate brokerage`;
  } else if (location) {
    query = `"${businessName}" ${location} real estate`;
  } else {
    query = `"${businessName}" real estate brokerage`;
  }
  
  console.log(`[DuckDuckGo] Business search query: ${query}`);
  return searchDuckDuckGo(query);
}
