/**
 * California Real Estate License Lookup
 * Queries the state's real estate commission/board for broker and agent licenses
 */

import { LicenseLookupResult } from './index';
import * as cheerio from 'cheerio';

export async function lookupCalifornia(
  name: string,
  phone?: string,
  email?: string
): Promise<LicenseLookupResult> {
  try {
    console.log(`[StateLicenseLookup] Searching California DRE for: ${name}`);
    
    const searchUrl = 'https://www2.dre.ca.gov/publicasp/pplinfo.asp';
    const formData = new URLSearchParams({
      'License_id': '',
      'LicenseeName': name,
      'LicenseeCity': '',
      'LicenseeZip': '',
      'Submit': 'Submit'
    });

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      return { found: false, source: 'California DRE' };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: Array<{name: string; licenseNumber: string; licenseType: string; status: string;}> = [];

    $('table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const licenseName = $(cells[0]).text().trim();
        const licenseNumber = $(cells[1]).text().trim();
        const licenseType = $(cells[2]).text().trim();
        const status = $(cells[3]).text().trim();
        
        if (licenseName && licenseNumber) {
          results.push({name: licenseName, licenseNumber, licenseType, status: status || 'Unknown'});
        }
      }
    });

    if (results.length === 0) {
      return { found: false, source: 'California DRE' };
    }

    const license = results.find(r => r.licenseType.toLowerCase().includes('broker')) || results[0];

    return {
      found: true,
      source: 'California DRE',
      name: license.name,
      licenseNumber: license.licenseNumber,
      licenseType: license.licenseType,
      licenseStatus: license.status
    };
  } catch (error: any) {
    console.error(`[StateLicenseLookup] California lookup failed:`, error.message);
    return {
      found: false,
      source: 'California License Lookup (Error)',
    };
  }
}
