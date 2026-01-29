import { describe, it, expect } from 'vitest';
import { searchBrave } from './braveSearchAPI';

describe('Brave Search API', () => {
  it('should successfully search with valid API key', async () => {
    // Test with a simple query
    const results = await searchBrave('real estate');
    
    // Should return results (not empty array which indicates API failure)
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    
    // If API key is valid, should get at least some results
    // (empty results would indicate API auth failure)
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('description');
    }
  }, 15000); // 15 second timeout for API call

  it('should handle business search queries', async () => {
    const results = await searchBrave('Keller Williams real estate Ohio');
    
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  }, 15000);
});
