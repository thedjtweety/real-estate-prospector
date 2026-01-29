/**
 * API Key Validator
 * Validates all required API keys on startup
 * Prevents silent failures from missing credentials
 */

export interface ApiKeyStatus {
  key: string;
  present: boolean;
  value?: string;
}

export interface ValidationResult {
  allValid: boolean;
  keys: ApiKeyStatus[];
  errors: string[];
}

const REQUIRED_KEYS = [
  'BRAVE_API_KEY',
  'GROQ_API_KEY',
  'JWT_SECRET'
];

const OPTIONAL_KEYS = [
  'VITE_APP_ID',
  'OAUTH_SERVER_URL'
];

/**
 * Validate all required API keys are present
 */
export function validateApiKeys(): ValidationResult {
  const result: ValidationResult = {
    allValid: true,
    keys: [],
    errors: []
  };
  
  console.log('[ApiValidator] Checking required API keys...');
  
  // Check required keys
  for (const key of REQUIRED_KEYS) {
    const present = !!process.env[key];
    result.keys.push({
      key,
      present,
      value: present ? '***' : undefined
    });
    
    if (!present) {
      result.allValid = false;
      result.errors.push(`Missing required API key: ${key}`);
      console.error(`❌ ${key} is missing`);
    } else {
      console.log(`✅ ${key} is present`);
    }
  }
  
  // Check optional keys
  console.log('[ApiValidator] Checking optional API keys...');
  for (const key of OPTIONAL_KEYS) {
    const present = !!process.env[key];
    result.keys.push({
      key,
      present,
      value: present ? '***' : undefined
    });
    
    if (!present) {
      console.warn(`⚠️  ${key} is missing (optional)`);
    } else {
      console.log(`✅ ${key} is present`);
    }
  }
  
  if (result.allValid) {
    console.log('[ApiValidator] ✅ All required API keys are present');
  } else {
    console.error('[ApiValidator] ❌ Some required API keys are missing');
    console.error('Please set the following environment variables:');
    result.errors.forEach(err => console.error(`  - ${err}`));
  }
  
  return result;
}

/**
 * Throw error if validation fails
 */
export function validateApiKeysOrThrow(): void {
  const result = validateApiKeys();
  if (!result.allValid) {
    throw new Error(
      `API Key validation failed:\n${result.errors.join('\n')}`
    );
  }
}

/**
 * Get API key with fallback
 */
export function getApiKey(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`API key not found: ${key}`);
  }
  return value;
}
