/**
 * Texas Real Estate License Lookup
 * Queries the state's real estate commission/board for broker and agent licenses
 */

import { LicenseLookupResult } from './index';
import * as cheerio from 'cheerio';

export async function lookupTexas(
  name: string,
  phone?: string,
  email?: string
): Promise<LicenseLookupResult> {
  try {
    console.log(`[StateLicenseLookup] Searching Texas TREC for: ${name}`);
    
    const searchUrl = 'https://www.trec.texas.gov/license-search';
    const formData = new URLSearchParams({'search_text': name});

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0'},
      body: formData.toString(),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) return { found: false, source: 'Texas TREC' };

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: Array<{name: string; licenseNumber: string; licenseType: string;}> = [];

    $('.license-result, .search-result, table tr').each((i, elem) => {
      const text = $(elem).text();
      if (text.includes(name.split(' ')[0])) {
        const licenseName = $(elem).find('.name, td:nth-child(1)').text().trim() || text.match(/[A-Z][a-z]+ [A-Z][a-z]+/)?.[0] || '';
        const licenseNumber = $(elem).find('.license-number, td:nth-child(2)').text().trim() || text.match(/\d{6,}/)?.[0] || '';
        const licenseType = $(elem).find('.license-type, td:nth-child(3)').text().trim() || 'Real Estate';
        if (licenseName && licenseNumber) results.push({name: licenseName, licenseNumber, licenseType});
      }
    });

    if (results.length === 0) return { found: false, source: 'Texas TREC' };

    const license = results[0];
    return {
      found: true,
      source: 'Texas TREC',
      name: license.name,
      licenseNumber: license.licenseNumber,
      licenseType: license.licenseType
    };
  } catch (error: any) {
    return { found: false, source: 'Texas TREC (Error)' };
  }
}
