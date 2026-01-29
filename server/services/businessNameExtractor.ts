/**
 * Business Name Extraction Module
 * 
 * Extracts business names from search results, website metadata, and HTML content
 */

/**
 * Extract business name from search result title
 * 
 * Examples:
 * "Keller Williams Realty - Real Estate Agents" → "Keller Williams Realty"
 * "MapQuest: Maps, Driving Directions, Live Traffic" → "MapQuest"
 * "Hunter Haas Realtors | Cincinnati Real Estate" → "Hunter Haas Realtors"
 */
export function extractBusinessNameFromTitle(title: string): string | null {
  if (!title) return null;

  // Remove common suffixes
  const suffixPatterns = [
    / - .*$/,  // Everything after " - "
    / \| .*$/,  // Everything after " | "
    / : .*$/,   // Everything after " : "
    / – .*$/,   // Everything after em dash
    / — .*$/,   // Everything after em dash
  ];

  let cleanedTitle = title.trim();
  
  for (const pattern of suffixPatterns) {
    cleanedTitle = cleanedTitle.replace(pattern, '').trim();
  }

  // Remove common trailing words
  const trailingWords = [
    'Home',
    'Homepage',
    'Official Site',
    'Official Website',
    'Welcome',
  ];

  for (const word of trailingWords) {
    if (cleanedTitle.endsWith(word)) {
      cleanedTitle = cleanedTitle.substring(0, cleanedTitle.length - word.length).trim();
    }
  }

  return cleanedTitle || null;
}

/**
 * Extract business name from multiple search results
 * Returns the most common/consistent name
 */
export function extractBusinessNameFromResults(results: Array<{ title: string; snippet?: string; url?: string }>): string | null {
  if (!results || results.length === 0) return null;

  const names: string[] = [];

  for (const result of results) {
    const name = extractBusinessNameFromTitle(result.title);
    if (name && name.length > 2) {
      names.push(name);
    }
  }

  if (names.length === 0) return null;

  // Find the most common name (in case of variations)
  const nameCounts = new Map<string, number>();
  
  for (const name of names) {
    const normalized = name.toLowerCase().trim();
    nameCounts.set(normalized, (nameCounts.get(normalized) || 0) + 1);
  }

  // Get the most frequent name
  let mostCommonName = '';
  let maxCount = 0;

  nameCounts.forEach((count, name) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonName = name;
    }
  });

  // Return the original casing from the first occurrence
  const originalName = names.find(n => n.toLowerCase().trim() === mostCommonName);
  return originalName || null;
}

/**
 * Extract business name from website metadata
 * Looks for og:site_name, Schema.org name, etc.
 */
export function extractBusinessNameFromMetadata(html: string): string | null {
  if (!html) return null;

  // Try og:site_name
  const ogSiteNameMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (ogSiteNameMatch) {
    return ogSiteNameMatch[1].trim();
  }

  // Try Schema.org name
  const schemaNameMatch = html.match(/"name"\s*:\s*"([^"]+)"/);
  if (schemaNameMatch) {
    return schemaNameMatch[1].trim();
  }

  // Try title tag as last resort
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    return extractBusinessNameFromTitle(titleMatch[1]);
  }

  return null;
}

/**
 * Validate if extracted name looks like a real business name
 */
export function isValidBusinessName(name: string | null): boolean {
  if (!name) return false;

  const invalidPatterns = [
    /^unknown/i,
    /^untitled/i,
    /^home$/i,
    /^homepage$/i,
    /^welcome$/i,
    /^index$/i,
    /^main$/i,
    /^contact$/i,
    /^about$/i,
    /^http/i,  // URL leaked through
    /^www\./i, // Domain leaked through
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(name)) {
      return false;
    }
  }

  // Must be at least 2 characters
  if (name.trim().length < 2) {
    return false;
  }

  return true;
}

/**
 * Main function: Extract business name from all available sources
 */
export function extractBusinessName(sources: {
  searchResults?: Array<{ title: string; snippet?: string; url?: string }>;
  websiteHtml?: string;
  userInput?: string;
}): string {
  // Priority 1: User provided name (if valid)
  if (sources.userInput && isValidBusinessName(sources.userInput)) {
    return sources.userInput;
  }

  // Priority 2: Search result titles
  if (sources.searchResults) {
    const nameFromResults = extractBusinessNameFromResults(sources.searchResults);
    if (nameFromResults && isValidBusinessName(nameFromResults)) {
      return nameFromResults;
    }
  }

  // Priority 3: Website metadata
  if (sources.websiteHtml) {
    const nameFromMetadata = extractBusinessNameFromMetadata(sources.websiteHtml);
    if (nameFromMetadata && isValidBusinessName(nameFromMetadata)) {
      return nameFromMetadata;
    }
  }

  // Fallback: User input even if invalid, or "Unknown Business"
  return sources.userInput || 'Unknown Business';
}
