/**
 * State License Lookup Router
 * Routes to the appropriate state lookup module based on state code
 */

import { lookupFlorida } from './florida';
import { lookupCalifornia } from './california';
import { lookupTexas } from './texas';
import { lookupNewYork } from './newYork';
import { lookupPennsylvania } from './pennsylvania';
import { lookupIllinois } from './illinois';
import { lookupOhio } from './ohio';
import { lookupGeorgia } from './georgia';
import { lookupNorthCarolina } from './northCarolina';
import { lookupMichigan } from './michigan';

export interface LicenseLookupResult {
  found: boolean;
  name?: string;
  licenseNumber?: string;
  licenseStatus?: string;
  licenseType?: string;
  company?: string;
  address?: string;
  phone?: string;
  email?: string;
  expirationDate?: string;
  source: string;
}

/**
 * Lookup broker/agent license information by state
 */
export async function lookupStateLicense(
  name: string,
  state: string,
  phone?: string,
  email?: string
): Promise<LicenseLookupResult> {
  const stateCode = state?.toUpperCase();

  try {
    switch (stateCode) {
      case 'FL':
      case 'FLORIDA':
        return await lookupFlorida(name, phone, email);
      case 'CA':
      case 'CALIFORNIA':
        return await lookupCalifornia(name, phone, email);
      case 'TX':
      case 'TEXAS':
        return await lookupTexas(name, phone, email);
      case 'NY':
      case 'NEW YORK':
        return await lookupNewYork(name, phone, email);
      case 'PA':
      case 'PENNSYLVANIA':
        return await lookupPennsylvania(name, phone, email);
      case 'IL':
      case 'ILLINOIS':
        return await lookupIllinois(name, phone, email);
      case 'OH':
      case 'OHIO':
        return await lookupOhio(name, phone, email);
      case 'GA':
      case 'GEORGIA':
        return await lookupGeorgia(name, phone, email);
      case 'NC':
      case 'NORTH CAROLINA':
        return await lookupNorthCarolina(name, phone, email);
      case 'MI':
      case 'MICHIGAN':
        return await lookupMichigan(name, phone, email);
      default:
        return {
          found: false,
          source: 'State License Lookup - Not Supported',
        };
    }
  } catch (error: any) {
    console.error(`[StateLicenseLookup] Error looking up ${state}:`, error.message);
    return {
      found: false,
      source: `State License Lookup - ${state} (Error)`,
    };
  }
}
