/**
 * Florida Real Estate License Lookup
 * Queries the state's real estate commission/board for broker and agent licenses
 */

import { LicenseLookupResult } from './index';
import * as cheerio from 'cheerio';

export async function lookupFlorida(
  name: string,
  phone?: string,
  email?: string
): Promise<LicenseLookupResult> {
  try {
    console.log(`[StateLicenseLookup] Searching Florida DBPR for: ${name}`);
    
    const searchUrl = 'https://www.myfloridalicense.com/wl11.asp';
    const searchParams = new URLSearchParams({
      mode: '1',
      SID: '',
      brd: '',
      search: 'Name',
      typ: '',
      name: name
    });

    const response = await fetch(`${searchUrl}?${searchParams}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.error(`[StateLicenseLookup] Florida HTTP ${response.status}`);
      return { found: false, source: 'Florida DBPR' };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse results table
    const results: Array<{
      name: string;
      licenseNumber: string;
      licenseType: string;
      status: string;
    }> = [];

    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header
      const cells = $(row).find('td');
      if (cells.length >= 4) {
        const licenseType = $(cells[0]).text().trim();
        const licenseName = $(cells[1]).text().trim();
        const licenseNumber = $(cells[3]).text().trim();
        const statusExpires = $(cells[4]).text().trim();
        
        // Only include real estate licenses
        if (licenseType.toLowerCase().includes('real estate') ||
            licenseType.toLowerCase().includes('broker') ||
            licenseType.toLowerCase().includes('sales')) {
          results.push({
            name: licenseName,
            licenseNumber,
            licenseType,
            status: statusExpires.split('/')[0]?.trim() || 'Unknown'
          });
        }
      }
    });

    if (results.length === 0) {
      console.log(`[StateLicenseLookup] No Florida licenses found for: ${name}`);
      return { found: false, source: 'Florida DBPR' };
    }

    // Return first real estate broker license found
    const broker = results.find(r => r.licenseType.toLowerCase().includes('broker'));
    const license = broker || results[0];

    console.log(`[StateLicenseLookup] Found Florida license: ${license.licenseNumber} (${license.licenseType})`);

    return {
      found: true,
      source: 'Florida DBPR',
      name: license.name,
      licenseNumber: license.licenseNumber,
      licenseType: license.licenseType,
      licenseStatus: license.status
    };
  } catch (error: any) {
    console.error(`[StateLicenseLookup] Florida lookup failed:`, error.message);
    return {
      found: false,
      source: 'Florida License Lookup (Error)',
    };
  }
}
