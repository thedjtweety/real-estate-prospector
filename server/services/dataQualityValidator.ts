/**
 * Data Quality Validator
 * 
 * Validates and scores lead data quality to handle bad/incomplete data gracefully.
 */

export interface DataQualityScore {
  field: 'name' | 'phone' | 'email' | 'website';
  value: string;
  score: number;
  isValid: boolean;
  reason?: string;
}

export interface ValidatedInput {
  name?: DataQualityScore;
  phone?: DataQualityScore;
  email?: DataQualityScore;
  website?: DataQualityScore;
  city?: string;
  state?: string;
  overallQuality: number;
  bestField: 'name' | 'phone' | 'email' | 'website' | null;
}

const PLACEHOLDER_PATTERNS = {
  name: [/^unknown$/i, /^n\/?a$/i, /^none$/i, /^test$/i, /^real estate agent$/i],
  email: [/@example\.com$/i, /@test\.com$/i, /^noreply@/i],
  phone: [/^555-?1234$/, /^123-?456-?7890$/, /^000-?000-?0000$/],
  website: [/^https?:\/\/example\.com/i, /^example\.com$/i],
};

export function validateInputData(input: any): ValidatedInput {
  const validated: ValidatedInput = {
    city: input.city,
    state: input.state,
    overallQuality: 50,
    bestField: null,
  };
  
  // Simple validation - just check if fields exist and aren't placeholders
  if (input.name && !PLACEHOLDER_PATTERNS.name.some(p => p.test(input.name))) {
    validated.name = { field: 'name', value: input.name, score: 80, isValid: true };
  }
  
  if (input.phone && !PLACEHOLDER_PATTERNS.phone.some(p => p.test(input.phone))) {
    validated.phone = { field: 'phone', value: input.phone, score: 85, isValid: true };
  }
  
  if (input.email && !PLACEHOLDER_PATTERNS.email.some(p => p.test(input.email))) {
    validated.email = { field: 'email', value: input.email, score: 75, isValid: true };
  }
  
  if (input.website && !PLACEHOLDER_PATTERNS.website.some(p => p.test(input.website))) {
    validated.website = { field: 'website', value: input.website, score: 90, isValid: true };
  }
  
  return validated;
}

export function getPrioritizedFields(validated: ValidatedInput) {
  const fields = [validated.name, validated.phone, validated.email, validated.website]
    .filter((f): f is DataQualityScore => f !== null && f !== undefined && f.isValid)
    .map(f => ({ field: f.field, value: f.value, score: f.score }))
    .sort((a, b) => b.score - a.score);
  return fields;
}
