import { callDataApi } from "../_core/dataApi";

export interface BusinessEnrichmentResult {
  success: boolean;
  data?: {
    name: string;
    website?: string;
    phone?: string;
    description?: string;
    staffCount?: number;
    industries?: string[];
    specialities?: string[];
    linkedinUrl?: string;
    crunchbaseUrl?: string;
  };
  error?: string;
}

/**
 * Enrich business data using LinkedIn company information
 */
export async function enrichBusinessFromLinkedIn(
  companyName: string
): Promise<BusinessEnrichmentResult> {
  try {
    // Convert company name to LinkedIn username format (lowercase, no spaces)
    const username = companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    const response = await callDataApi("LinkedIn/get_company_details", {
      query: { username },
    }) as any;

    if (!response || !response.success) {
      return {
        success: false,
        error: "Company not found on LinkedIn",
      };
    }

    const data = response.data as any;

    return {
      success: true,
      data: {
        name: data.name || companyName,
        website: data.website,
        phone: data.phone,
        description: data.description,
        staffCount: data.staffCount,
        industries: data.industries || [],
        specialities: data.specialities || [],
        linkedinUrl: data.linkedinUrl,
        crunchbaseUrl: data.crunchbaseUrl,
      },
    };
  } catch (error) {
    console.error("LinkedIn enrichment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search for business using multiple strategies
 */
export async function searchBusinessMultiSource(params: {
  name?: string;
  website?: string;
  phone?: string;
}): Promise<BusinessEnrichmentResult> {
  // Try LinkedIn first if we have a company name
  if (params.name) {
    const linkedInResult = await enrichBusinessFromLinkedIn(params.name);
    if (linkedInResult.success) {
      return linkedInResult;
    }
  }

  // Could add more data sources here (Google Places, etc.)
  
  return {
    success: false,
    error: "No data found from available sources",
  };
}

/**
 * Verify business information by cross-referencing multiple fields
 */
export function calculateVerificationScore(params: {
  inputData: {
    name?: string;
    website?: string;
    phone?: string;
    email?: string;
  };
  enrichedData: {
    name?: string;
    website?: string;
    phone?: string;
  };
}): number {
  let matches = 0;
  let total = 0;

  // Compare name
  if (params.inputData.name && params.enrichedData.name) {
    total++;
    const inputName = params.inputData.name.toLowerCase().trim();
    const enrichedName = params.enrichedData.name.toLowerCase().trim();
    if (inputName.includes(enrichedName) || enrichedName.includes(inputName)) {
      matches++;
    }
  }

  // Compare website
  if (params.inputData.website && params.enrichedData.website) {
    total++;
    const inputDomain = extractDomain(params.inputData.website);
    const enrichedDomain = extractDomain(params.enrichedData.website);
    if (inputDomain === enrichedDomain) {
      matches++;
    }
  }

  // Compare phone
  if (params.inputData.phone && params.enrichedData.phone) {
    total++;
    const inputPhone = normalizePhone(params.inputData.phone);
    const enrichedPhone = normalizePhone(params.enrichedData.phone);
    if (inputPhone === enrichedPhone) {
      matches++;
    }
  }

  // Return score between 0 and 1
  return total > 0 ? matches / total : 0;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url.toLowerCase().replace(/^www\./, "");
  }
}

function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, "");
}
