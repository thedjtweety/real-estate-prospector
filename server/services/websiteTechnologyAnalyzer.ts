/**
 * Website Technology Analyzer
 * 
 * Analyzes company websites to detect transaction management platforms,
 * CRMs, and other real estate technologies used by brokerages
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { withRetry } from './retryUtil';
import { 
  findPlatformsByKeyword, 
  findPlatformsByDomain,
  TRANSACTION_PLATFORMS,
  type TransactionPlatform 
} from './transactionManagementDB';

export interface DetectedTechnology {
  platform: TransactionPlatform;
  source: string; // 'website_content', 'meta_tags', 'scripts', 'links', 'forms'
  confidence: number; // 0-100
  evidence: string; // What was found that indicates this platform
}

/**
 * Analyze website for technology stack
 */
export async function analyzeWebsiteTechnology(
  websiteUrl: string
): Promise<DetectedTechnology[]> {
  try {
    console.log(`[WebsiteTech] Analyzing: ${websiteUrl}`);
    
    if (!websiteUrl || !websiteUrl.startsWith('http')) {
      console.log('[WebsiteTech] Invalid URL provided');
      return [];
    }

    const response = await withRetry(
      () => axios.get(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
        maxRedirects: 5,
      })
    );

    const $ = cheerio.load(response.data);
    const detected: DetectedTechnology[] = [];

    // 1. Check meta tags and script sources
    const scriptSources = new Set<string>();
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src') || '';
      scriptSources.add(src.toLowerCase());
    });

    // 2. Check for platform-specific indicators in scripts
    for (const script of Array.from(scriptSources)) {
      for (const platform of TRANSACTION_PLATFORMS) {
        for (const keyword of platform.keywords) {
          if (script.includes(keyword.toLowerCase())) {
            detected.push({
              platform,
              source: 'scripts',
              confidence: 85,
              evidence: `Script source contains: ${script}`,
            });
            break;
          }
        }
      }
    }

    // 3. Check for platform links in navigation and footer
    const allLinks = new Set<string>();
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      allLinks.add(href.toLowerCase());
    });

    for (const link of Array.from(allLinks)) {
      const platform = findPlatformsByDomain(link);
      if (platform) {
        detected.push({
          platform,
          source: 'links',
          confidence: 90,
          evidence: `Found link to: ${link}`,
        });
      }

      // Also check for keyword matches
      for (const p of TRANSACTION_PLATFORMS) {
        for (const keyword of p.keywords) {
          if (link.includes(keyword.toLowerCase())) {
            detected.push({
              platform: p,
              source: 'links',
              confidence: 80,
              evidence: `Found link containing: ${keyword}`,
            });
            break;
          }
        }
      }
    }

    // 4. Check page content for platform mentions
    const pageText = $.text().toLowerCase();
    for (const platform of TRANSACTION_PLATFORMS) {
      for (const keyword of platform.keywords) {
        if (pageText.includes(keyword.toLowerCase())) {
          detected.push({
            platform,
            source: 'website_content',
            confidence: 70,
            evidence: `Found mention of: ${keyword}`,
          });
          break;
        }
      }
    }

    // 5. Check for form attributes that might indicate platform
    $('form').each((_, el) => {
      const action = $(el).attr('action') || '';
      const name = $(el).attr('name') || '';
      const id = $(el).attr('id') || '';
      
      const formIdentifiers = `${action} ${name} ${id}`.toLowerCase();
      
      for (const platform of TRANSACTION_PLATFORMS) {
        for (const keyword of platform.keywords) {
          if (formIdentifiers.includes(keyword.toLowerCase())) {
            detected.push({
              platform,
              source: 'forms',
              confidence: 75,
              evidence: `Found form with platform identifier: ${keyword}`,
            });
            break;
          }
        }
      }
    });

    // 6. Check meta tags for platform references
    $('meta').each((_, el) => {
      const content = $(el).attr('content') || '';
      const name = $(el).attr('name') || '';
      const property = $(el).attr('property') || '';
      
      const metaText = `${content} ${name} ${property}`.toLowerCase();
      
      for (const platform of TRANSACTION_PLATFORMS) {
        for (const keyword of platform.keywords) {
          if (metaText.includes(keyword.toLowerCase())) {
            detected.push({
              platform,
              source: 'meta_tags',
              confidence: 65,
              evidence: `Found in meta tags: ${keyword}`,
            });
            break;
          }
        }
      }
    });

    // Deduplicate and merge by platform
    const mergedDetections = new Map<string, DetectedTechnology>();
    for (const detection of detected) {
      const key = detection.platform.id;
      if (!mergedDetections.has(key)) {
        mergedDetections.set(key, detection);
      } else {
        // Keep the one with higher confidence
        const existing = mergedDetections.get(key)!;
        if (detection.confidence > existing.confidence) {
          mergedDetections.set(key, detection);
        }
      }
    }

    const result = Array.from(mergedDetections.values())
      .sort((a, b) => b.confidence - a.confidence);

    console.log(`[WebsiteTech] Found ${result.length} technologies`);
    return result;

  } catch (error: any) {
    console.error('[WebsiteTech] Analysis failed:', error.message);
    return [];
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Normalize URL to ensure it has protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}
