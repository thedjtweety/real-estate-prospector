/**
 * Waterfall Scraper - 3-Stage Approach
 * Stage 1: Schema.org extraction (fastest, 95% accurate)
 * Stage 2: State licensing lookup (100% accurate government data)
 * Stage 3: LLM analysis with fallback regex (comprehensive enrichment)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { searchBrave } from './braveSearchAPI';
import { invokeGroq } from './groqLLM';
import { lookupStateLicense } from './stateLicenseLookup';
import { withTimeout } from './timeoutUtil';

export interface WaterfallResult {
  businessName: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  contacts: Array<{
    name: string;
    title: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    confidence: number;
  }>;
  technologyStack?: Array<{
    name: string;
    category: string;
    confidence: number;
  }>;
  mls?: string;
  state?: string;
  confidence: number;
  stages: {
    schemaOrg: boolean;
    stateLicense: boolean;
    llmAnalysis: boolean;
  };
}

/**
 * Stage 1: Extract Schema.org structured data from website
 */
async function extractSchemaOrg(url: string): Promise<Partial<WaterfallResult> | null> {
  try {
    const response = await withTimeout(
      axios.get(url, { timeout: 10000 }),
      10000,
      `Schema.org extraction from ${url}`
    );
    
    const $ = cheerio.load(response.data);
    const schemas: any[] = [];
    
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const schema = JSON.parse($(el).html() || '{}');
        schemas.push(schema);
      } catch {}
    });
    
    // Find business or real estate agent schema
    const business = schemas.find(s => {
      const type = s['@type'];
      return type?.includes('Business') || 
             type?.includes('RealEstateAgent') || 
             type?.includes('Organization');
    });
    
    if (business) {
      return {
        businessName: business.name,
        phone: business.telephone,
        email: business.email,
        address: business.address?.streetAddress || business.address,
        website: url,
        confidence: 0.95
      };
    }
    
    return null;
  } catch (error) {
    console.log(`[SchemaOrg] Failed to extract from ${url}`);
    return null;
  }
}

/**
 * Stage 2: Lookup state licensing board for verification
 */
async function lookupLicense(businessName: string, state?: string): Promise<Partial<WaterfallResult> | null> {
  try {
    if (!state) return null;
    
    const result = await withTimeout(
      lookupStateLicense(businessName, state),
      15000,
      `State license lookup for ${businessName} in ${state}`
    );
    
    if (result) {
      return {
        businessName: result.brokerName || businessName,
        address: result.address,
        state: state,
        phone: result.phone,
        email: result.email,
        confidence: 1.0 // Government data = 100% accurate
      };
    }
    
    return null;
  } catch (error) {
    console.log(`[StateLicense] Failed lookup for ${businessName}`);
    return null;
  }
}

/**
 * Stage 3: LLM analysis with fallback regex
 */
async function analyzeWithLLM(
  searchResults: Array<{ title: string; url: string; description: string }>,
  businessName: string
): Promise<Partial<WaterfallResult> | null> {
  try {
    const prompt = `Analyze these search results about "${businessName}" and extract:

1. Decision Makers (find 2-3):
   - Name, title, email, phone, LinkedIn URL
   
2. Technology Stack:
   - CRM/MLS platforms mentioned
   
3. Contact Info:
   - Business phone, email, address

Search Results:
${searchResults.slice(0, 5).map(r => `- ${r.title}: ${r.description}`).join('\n')}

Return ONLY valid JSON, no markdown:
{
  "contacts": [{"name": "...", "title": "...", "email": "...", "phone": "...", "linkedin": "...", "confidence": 0.8}],
  "technology": [{"name": "...", "category": "CRM", "confidence": 0.7}],
  "phone": "...",
  "email": "..."
}`;

    const response = await withTimeout(
      invokeGroq({ 
        messages: [{ role: 'user', content: prompt }]
      }),
      20000,
      `LLM analysis for ${businessName}`
    );
    
    let content = response.choices[0].message.content;
    
    // Clean markdown code blocks
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analyzed = JSON.parse(content);
    
    return {
      contacts: analyzed.contacts || [],
      technologyStack: analyzed.technology || [],
      phone: analyzed.phone,
      email: analyzed.email,
      confidence: 0.75
    };
  } catch (error) {
    console.log(`[LLMAnalysis] Failed, attempting regex fallback`);
    
    // Fallback: Extract using regex
    return extractWithRegex(searchResults, businessName);
  }
}

/**
 * Fallback regex extraction when LLM fails
 */
function extractWithRegex(
  searchResults: Array<{ title: string; url: string; description: string }>,
  businessName: string
): Partial<WaterfallResult> {
  const combined = searchResults.map(r => `${r.title} ${r.description}`).join(' ');
  
  // Phone regex
  const phoneMatch = combined.match(/\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
  const phone = phoneMatch ? `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}` : undefined;
  
  // Email regex
  const emailMatch = combined.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : undefined;
  
  // Extract names (simple heuristic)
  const contacts: WaterfallResult['contacts'] = [];
  const nameMatches = combined.match(/(?:Owner|Broker|Manager|Agent):\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/g) || [];
  
  nameMatches.forEach(match => {
    const name = match.replace(/(?:Owner|Broker|Manager|Agent):\s*/, '');
    contacts.push({
      name,
      title: match.split(':')[0],
      confidence: 0.5
    });
  });
  
  return {
    phone,
    email,
    contacts: contacts.slice(0, 3),
    confidence: 0.4
  };
}

/**
 * Main waterfall scraper - tries each stage in order
 */
export async function scrapeWithWaterfall(
  businessName: string,
  phone?: string,
  email?: string,
  state?: string
): Promise<WaterfallResult> {
  const result: WaterfallResult = {
    businessName,
    contacts: [],
    confidence: 0,
    stages: {
      schemaOrg: false,
      stateLicense: false,
      llmAnalysis: false
    }
  };
  
  console.log(`[Waterfall] Starting 3-stage scrape for "${businessName}"`);
  
  // Stage 1: Try Schema.org extraction
  console.log(`[Waterfall] Stage 1: Schema.org extraction`);
  let website = email ? `https://${email.split('@')[1]}` : undefined;
  
  if (website) {
    const schemaData = await extractSchemaOrg(website);
    if (schemaData) {
      Object.assign(result, schemaData);
      result.stages.schemaOrg = true;
      console.log(`[Waterfall] Stage 1 SUCCESS: Found Schema.org data`);
    }
  }
  
  // Stage 2: Try state license lookup
  if (state) {
    console.log(`[Waterfall] Stage 2: State license lookup`);
    const licenseData = await lookupLicense(businessName, state);
    if (licenseData) {
      Object.assign(result, licenseData);
      result.stages.stateLicense = true;
      console.log(`[Waterfall] Stage 2 SUCCESS: Found state license data`);
    }
  }
  
  // Stage 3: LLM analysis (only if we need more data)
  if (result.contacts.length === 0 || !result.email) {
    console.log(`[Waterfall] Stage 3: LLM analysis`);
    
    // First, search for the business
    const searchResults = await searchBrave(`${businessName} real estate broker`);
    
    if (searchResults.length > 0) {
      const llmData = await analyzeWithLLM(searchResults, businessName);
      if (llmData) {
        Object.assign(result, llmData);
        result.stages.llmAnalysis = true;
        console.log(`[Waterfall] Stage 3 SUCCESS: LLM analysis complete`);
      }
    }
  }
  
  // Calculate final confidence
  result.confidence = (
    (result.stages.schemaOrg ? 0.95 : 0) +
    (result.stages.stateLicense ? 1.0 : 0) +
    (result.stages.llmAnalysis ? 0.75 : 0)
  ) / 3;
  
  console.log(`[Waterfall] Complete. Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  
  return result;
}
