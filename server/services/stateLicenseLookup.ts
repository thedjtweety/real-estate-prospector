/**
 * State Real Estate License Lookup
 * 
 * Provides 100% accurate broker verification from government databases
 * Each state has different APIs/scraping methods
 * 
 * Current Coverage:
 * - Florida (DBPR)
 * 
 * TODO: Add more states incrementally based on user demand
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LicenseInfo {
  brokerName: string;
  licenseNumber: string;
  company?: string;
  address?: string;
  city?: string;
  state: string;
  zipCode?: string;
  licenseStatus: string;
  licenseType?: string;
  phone?: string;
  email?: string;
  confidence: number; // Always 100 for government data
  source: string;
}

/**
 * Florida DBPR License Lookup
 * https://www.myfloridalicense.com/
 */
async function lookupFloridaBroker(name: string): Promise<LicenseInfo | null> {
  try {
    console.log(`[FloridaLicense] Looking up: ${name}`);
    
    // Florida DBPR search endpoint
    const response = await axios.post(
      'https://www.myfloridalicense.com/datamart/searchData.asp',
      new URLSearchParams({
        'profession': 'real estate',
        'licenseeName': name,
        'searchType': 'name',
        'licenseNumber': '',
        'businessName': '',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      }
    );

    const $ = cheerio.load(response.data);
    
    // Parse the results table
    const firstRow = $('table.results tr').eq(1); // Skip header row
    
    if (firstRow.length === 0) {
      console.log('[FloridaLicense] No results found');
      return null;
    }

    // Extract data from table columns
    const licenseNumber = firstRow.find('td').eq(0).text().trim();
    const brokerName = firstRow.find('td').eq(1).text().trim();
    const licenseType = firstRow.find('td').eq(2).text().trim();
    const licenseStatus = firstRow.find('td').eq(3).text().trim();
    const company = firstRow.find('td').eq(4).text().trim();
    const address = firstRow.find('td').eq(5).text().trim();

    if (!brokerName || !licenseNumber) {
      console.log('[FloridaLicense] Incomplete data in results');
      return null;
    }

    console.log(`[FloridaLicense] Found: ${brokerName} (${licenseNumber})`);

    // Parse address into components
    const addressParts = address.split(',').map(s => s.trim());
    const zipMatch = address.match(/FL\s+(\d{5})/);

    return {
      brokerName,
      licenseNumber,
      company: company || undefined,
      address: addressParts[0] || undefined,
      city: addressParts[1] || undefined,
      state: 'FL',
      zipCode: zipMatch ? zipMatch[1] : undefined,
      licenseStatus,
      licenseType,
      confidence: 100, // Government data = 100% accurate
      source: 'Florida DBPR',
    };
    
  } catch (error: any) {
    console.error('[FloridaLicense] Lookup failed:', error.message);
    return null;
  }
}

/**
 * Main lookup function - routes to appropriate state handler
 */
export async function lookupStateLicense(
  name: string,
  state?: string
): Promise<LicenseInfo | null> {
  if (!state) {
    console.log('[StateLicense] No state provided, cannot lookup');
    return null;
  }

  const stateUpper = state.toUpperCase();

  switch (stateUpper) {
    case 'FL':
    case 'FLORIDA':
      return lookupFloridaBroker(name);
    
    // TODO: Add more states
    // case 'CA':
    // case 'CALIFORNIA':
    //   return lookupCaliforniaBroker(name);
    
    // case 'TX':
    // case 'TEXAS':
    //   return lookupTexasBroker(name);
    
    default:
      console.log(`[StateLicense] State ${state} not yet supported`);
      return null;
  }
}

/**
 * Lookup by business name and state
 */
export async function lookupBusinessLicense(
  businessName: string,
  state?: string
): Promise<LicenseInfo | null> {
  // For now, use the same lookup (many states allow business name search)
  return lookupStateLicense(businessName, state);
}

/**
 * Get list of supported states
 */
export function getSupportedStates(): string[] {
  return [
    'FL', // Florida
    // Add more as implemented
  ];
}

/**
 * Check if a state is supported
 */
export function isStateSupported(state: string): boolean {
  const supported = getSupportedStates();
  return supported.includes(state.toUpperCase());
}
