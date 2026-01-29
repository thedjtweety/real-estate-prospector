/**
 * Parallel Search Executor
 * Executes multiple searches in parallel using Brave and DuckDuckGo
 */

import { searchBrave } from './braveSearchAPI';
import { searchDuckDuckGo } from './duckDuckGoScraper';
import { GeneratedQuery } from './multiSearchQueryGenerator';

export interface SearchResult {
  query: string;
  purpose: string;
  source: 'brave' | 'duckduckgo';
  results: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  timestamp: Date;
}

/**
 * Execute multiple searches in parallel with fallback from Brave to DuckDuckGo
 */
export async function executeParallelSearches(
  queries: GeneratedQuery[],
  onProgress?: (completed: number, total: number, currentQuery: string) => void
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  let completed = 0;

  console.log(`[ParallelSearch] Executing ${queries.length} searches...`);

  // Execute searches in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (generatedQuery) => {
      if (onProgress) {
        onProgress(completed, queries.length, generatedQuery.query);
      }

      try {
        // Try Brave first
        console.log(`[ParallelSearch] Searching Brave: "${generatedQuery.query}"`);
        const braveResults = await searchBrave(generatedQuery.query);
        
        if (braveResults && braveResults.length > 0) {
          completed++;
          if (onProgress) {
            onProgress(completed, queries.length, generatedQuery.query);
          }
          
          return {
            query: generatedQuery.query,
            purpose: generatedQuery.purpose,
            source: 'brave' as const,
            results: braveResults.slice(0, 10), // Top 10 results
            timestamp: new Date()
          };
        }
      } catch (error: any) {
        console.log(`[ParallelSearch] Brave failed for "${generatedQuery.query}", trying DuckDuckGo...`);
      }

      try {
        // Fallback to DuckDuckGo
        console.log(`[ParallelSearch] Searching DuckDuckGo: "${generatedQuery.query}"`);
        const ddgResults = await searchDuckDuckGo(generatedQuery.query);
        
        completed++;
        if (onProgress) {
          onProgress(completed, queries.length, generatedQuery.query);
        }
        
        return {
          query: generatedQuery.query,
          purpose: generatedQuery.purpose,
          source: 'duckduckgo' as const,
          results: ddgResults.slice(0, 10), // Top 10 results
          timestamp: new Date()
        };
      } catch (error: any) {
        console.error(`[ParallelSearch] Both searches failed for "${generatedQuery.query}":`, error.message);
        completed++;
        if (onProgress) {
          onProgress(completed, queries.length, generatedQuery.query);
        }
        
        return {
          query: generatedQuery.query,
          purpose: generatedQuery.purpose,
          source: 'duckduckgo' as const,
          results: [],
          timestamp: new Date()
        };
      }
    });

    // Wait for batch to complete before starting next batch
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to respect rate limits
    if (i + batchSize < queries.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`[ParallelSearch] Completed ${results.length} searches`);
  return results;
}

/**
 * Aggregate all search results into a single dataset
 */
export function aggregateSearchResults(searchResults: SearchResult[]): {
  allUrls: string[];
  allTitles: string[];
  allDescriptions: string[];
  resultsByPurpose: Map<string, SearchResult[]>;
} {
  const allUrls: string[] = [];
  const allTitles: string[] = [];
  const allDescriptions: string[] = [];
  const resultsByPurpose = new Map<string, SearchResult[]>();

  for (const searchResult of searchResults) {
    // Group by purpose
    const existing = resultsByPurpose.get(searchResult.purpose) || [];
    existing.push(searchResult);
    resultsByPurpose.set(searchResult.purpose, existing);

    // Collect all data
    for (const result of searchResult.results) {
      if (result.url && !allUrls.includes(result.url)) {
        allUrls.push(result.url);
      }
      if (result.title) {
        allTitles.push(result.title);
      }
      if (result.description) {
        allDescriptions.push(result.description);
      }
    }
  }

  return { allUrls, allTitles, allDescriptions, resultsByPurpose };
}
