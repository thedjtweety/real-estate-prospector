import axios from 'axios';
import { withRetry } from './retryUtil';

/**
 * Brave Search API Integration
 * Free tier: 2,000 searches/month
 * No credit card required
 * https://brave.com/search/api/
 */

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

/**
 * Search using Brave Search API
 * Returns clean JSON results without HTML parsing
 */
export async function searchBrave(query: string): Promise<BraveSearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  
  if (!apiKey) {
    console.error('[BraveSearch] BRAVE_API_KEY not found in environment variables');
    console.error('[BraveSearch] Get your free API key at: https://brave.com/search/api/');
    return [];
  }

  try {
    console.log(`[BraveSearch] Searching for: ${query}`);
    
    // Wrap API call with retry logic
    const response = await withRetry(
      () => axios.get('https://api.search.brave.com/res/v1/web/search', {
        params: {
          q: query,
          count: 10, // Number of results (max 20)
          search_lang: 'en',
          country: 'US',
        },
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        timeout: 10000,
      })
    );

    if (!response.data || !response.data.web || !response.data.web.results) {
      console.log('[BraveSearch] No results found in API response');
      return [];
    }

    const results: BraveSearchResult[] = response.data.web.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      description: result.description || '',
      snippet: result.description || '',
    }));

    console.log(`[BraveSearch] Found ${results.length} results`);
    return results;
    
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('[BraveSearch] Authentication failed - check your BRAVE_API_KEY');
    } else if (error.response?.status === 429) {
      console.error('[BraveSearch] Rate limit exceeded (2,000 searches/month on free tier)');
    } else {
      console.error('[BraveSearch] Search failed:', error.message);
    }
    return [];
  }
}

/**
 * Search for business information using Brave
 */
export async function searchBusinessBrave(
  businessName: string,
  location?: string,
  phone?: string
): Promise<BraveSearchResult[]> {
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
  
  console.log(`[BraveSearch] Business search query: ${query}`);
  return searchBrave(query);
}
