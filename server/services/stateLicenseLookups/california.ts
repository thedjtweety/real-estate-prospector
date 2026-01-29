/**
 * California Real Estate License Lookup
 * 
 * Official Source: California Department of Real Estate (DRE)
 * URL: https://www2.dre.ca.gov/PublicASP/pplinfo.asp
 * Method: HTML form scraping
 * Coverage: ~12% of US real estate market
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CaliforniaLicenseResult {
  name: string;
  licenseNumber: string;
  licenseType: string;
  status: string;
  expirationDate?: string;
  businessName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  source: 'California DRE';
  verified: boolean;
  confidence: number;
}

/**
 * Lookup California real estate license by name
 */
export async function lookupCaliforniaLicense(params: {
  name?: string;
  licenseNumber?: string;
  businessName?: string;
}): Promise<CaliforniaLicenseResult[]> {
  try {
    console.log('[California] Looking up license:', params);

    const { name, licenseNumber, businessName } = params;

    if (!name && !licenseNumber && !businessName) {
      console.log('[California] No search parameters provided');
      return [];
    }

    // California DRE search form
    const searchUrl = 'https://www2.dre.ca.gov/PublicASP/pplinfo.asp';
    
    const formData = new URLSearchParams();
    
    if (licenseNumber) {
      formData.append('LicNum', licenseNumber);
    } else if (name) {
      // Split name into first and last
      const nameParts = name.trim().split(/\s+/);
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts.slice(0, -1).join(' ') || '';
      
      formData.append('LastName', lastName);
      if (firstName) {
        formData.append('FirstName', firstName);
      }
    } else if (businessName) {
      formData.append('BusName', businessName);
    }

    formData.append('search', 'Search');

    const response = await axios.post(searchUrl, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const results: CaliforniaLicenseResult[] = [];

    // Parse results table
    $('table tr').each((index, element) => {
      if (index === 0) return; // Skip header row

      const cells = $(element).find('td');
      if (cells.length < 4) return;

      const licName = $(cells[0]).text().trim();
      const licNum = $(cells[1]).text().trim();
      const licType = $(cells[2]).text().trim();
      const licStatus = $(cells[3]).text().trim();
      const expDate = $(cells[4])?.text().trim();

      if (!licName || !licNum) return;

      results.push({
        name: licName,
        licenseNumber: licNum,
        licenseType: licType,
        status: licStatus,
        expirationDate: expDate,
        source: 'California DRE',
        verified: licStatus.toLowerCase().includes('active'),
        confidence: 100, // Government data is 100% accurate
      });
    });

    console.log(`[California] Found ${results.length} license(s)`);
    return results;

  } catch (error: any) {
    console.error('[California] License lookup failed:', error.message);
    return [];
  }
}

/**
 * Verify if a broker is licensed in California
 */
export async function verifyCaliforniaBroker(name: string): Promise<boolean> {
  const results = await lookupCaliforniaLicense({ name });
  return results.some(r => 
    r.verified && 
    (r.licenseType.toLowerCase().includes('broker') || 
     r.licenseType.toLowerCase().includes('salesperson'))
  );
}
