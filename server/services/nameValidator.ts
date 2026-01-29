/**
 * Contact Name Validation
 * Filters out garbage text fragments that aren't real names
 */

// Common words that appear in scraped text but aren't names
const GARBAGE_WORDS = new Set([
  'and', 'the', 'new', 'our', 'your', 'their', 'this', 'that', 'with', 'from',
  'have', 'been', 'were', 'will', 'would', 'could', 'should', 'about', 'more',
  'than', 'such', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very',
  'can', 'just', 'dont', 'should', 'now', 'equal', 'real', 'estate', 'agent',
  'broker', 'office', 'manager', 'admin', 'team', 'staff', 'contact', 'call',
  'email', 'phone', 'address', 'location', 'service', 'services', 'company',
  'business', 'group', 'realty', 'properties', 'property', 'home', 'homes',
  'house', 'houses', 'sale', 'sales', 'buy', 'sell', 'rent', 'lease', 'listing',
  'listings', 'search', 'find', 'view', 'see', 'learn', 'read', 'click', 'here',
  'message', 'recommend', 'verified', 'neighbors', 'saying', 'what', 'kopf'
]);

// Common real estate titles (not names)
const TITLE_WORDS = new Set([
  'broker', 'agent', 'realtor', 'owner', 'manager', 'admin', 'assistant',
  'coordinator', 'director', 'president', 'vice', 'executive', 'senior',
  'junior', 'associate', 'principal', 'managing', 'office', 'sales', 'listing',
  'buyer', 'transaction', 'closing', 'escrow', 'title', 'mortgage', 'loan'
]);

/**
 * Check if a string looks like a real person's name
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  
  // Must have at least 2 characters
  if (trimmed.length < 2) return false;
  
  // Must have at least one space (first + last name)
  if (!trimmed.includes(' ')) return false;
  
  // Split into words
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  
  // Must have exactly 2 or 3 words (First Last or First Middle Last)
  if (words.length < 2 || words.length > 3) return false;
  
  // Each word must start with capital letter
  for (const word of words) {
    if (!/^[A-Z]/.test(word)) return false;
  }
  
  // Check if any word is a garbage word
  for (const word of words) {
    if (GARBAGE_WORDS.has(word.toLowerCase())) {
      return false;
    }
  }
  
  // Check if any word is a title (not a name)
  for (const word of words) {
    if (TITLE_WORDS.has(word.toLowerCase())) {
      return false;
    }
  }
  
  // Must not contain numbers
  if (/\d/.test(trimmed)) return false;
  
  // Must not contain special characters (except hyphens and apostrophes)
  if (/[^a-zA-Z\s'-]/.test(trimmed)) return false;
  
  // Passed all checks
  return true;
}

/**
 * Extract and validate names from text
 */
export function extractValidNames(text: string): string[] {
  // Pattern for capitalized names (First Last)
  const namePattern = /\b([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)\s+([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?)\b/g;
  const matches = Array.from(text.matchAll(namePattern));
  
  const validNames: string[] = [];
  const seen = new Set<string>();
  
  for (const match of matches) {
    const fullName = match[0];
    const normalized = fullName.toLowerCase();
    
    // Skip if already seen
    if (seen.has(normalized)) continue;
    
    // Validate the name
    if (isValidName(fullName)) {
      validNames.push(fullName);
      seen.add(normalized);
    }
  }
  
  return validNames;
}

/**
 * Score name quality (0-100)
 */
export function scoreNameQuality(name: string): number {
  if (!isValidName(name)) return 0;
  
  let score = 50; // Base score for valid format
  
  const words = name.trim().split(/\s+/);
  
  // Bonus for reasonable name length
  const totalLength = name.replace(/\s/g, '').length;
  if (totalLength >= 6 && totalLength <= 30) {
    score += 20;
  }
  
  // Bonus for each word being reasonable length (2-15 chars)
  for (const word of words) {
    if (word.length >= 2 && word.length <= 15) {
      score += 10;
    }
  }
  
  // Bonus for having exactly 2 words (most common)
  if (words.length === 2) {
    score += 10;
  }
  
  // Bonus for mixed case (not all caps)
  if (name !== name.toUpperCase()) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * Clean and validate a contact name
 */
export function cleanContactName(rawName: string): string | null {
  if (!rawName) return null;
  
  // Remove extra whitespace
  const cleaned = rawName.trim().replace(/\s+/g, ' ');
  
  // Validate
  if (!isValidName(cleaned)) return null;
  
  return cleaned;
}
