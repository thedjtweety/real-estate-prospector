/**
 * Transaction Management Platform Database
 * 
 * Comprehensive database of real estate transaction management platforms,
 * CRMs, and MLS systems with keywords, identifiers, and detection patterns
 */

export interface TransactionPlatform {
  id: string;
  name: string;
  category: 'crm' | 'mls' | 'transaction_management' | 'hybrid';
  keywords: string[];
  domains: string[];
  jobPostingKeywords: string[];
  confidence: number; // 0-100
  description: string;
}

/**
 * Comprehensive database of transaction management platforms used by real estate brokerages
 */
export const TRANSACTION_PLATFORMS: TransactionPlatform[] = [
  // Major CRM/Transaction Management Platforms
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    keywords: ['salesforce', 'salesforce.com', 'sfdc', 'crm'],
    domains: ['salesforce.com', 'force.com'],
    jobPostingKeywords: ['salesforce', 'salesforce crm', 'salesforce administrator', 'salesforce developer'],
    confidence: 95,
    description: 'Leading CRM platform used by many brokerages for lead management and customer relationships',
  },
  {
    id: 'follow_up_boss',
    name: 'Follow Up Boss',
    category: 'crm',
    keywords: ['follow up boss', 'followupboss', 'fub'],
    domains: ['followupboss.com'],
    jobPostingKeywords: ['follow up boss', 'followupboss', 'real estate crm'],
    confidence: 90,
    description: 'Real estate-specific CRM designed for brokers and agents',
  },
  {
    id: 'ziplogix',
    name: 'Ziplogix',
    category: 'transaction_management',
    keywords: ['ziplogix', 'zip logix'],
    domains: ['ziplogix.com'],
    jobPostingKeywords: ['ziplogix', 'transaction management', 'document management'],
    confidence: 85,
    description: 'Transaction management and document collaboration platform',
  },
  {
    id: 'dotloop',
    name: 'dotloop',
    category: 'transaction_management',
    keywords: ['dotloop', 'dot loop'],
    domains: ['dotloop.com'],
    jobPostingKeywords: ['dotloop', 'transaction management', 'real estate documents'],
    confidence: 90,
    description: 'Zillow-owned transaction management platform for real estate professionals',
  },
  {
    id: 'zipforms',
    name: 'ZipForms',
    category: 'transaction_management',
    keywords: ['zipforms', 'zip forms'],
    domains: ['zipforms.com'],
    jobPostingKeywords: ['zipforms', 'forms management', 'real estate forms'],
    confidence: 85,
    description: 'Digital forms and document management for real estate transactions',
  },
  {
    id: 'real_estate_webmasters',
    name: 'Real Estate Webmasters',
    category: 'hybrid',
    keywords: ['real estate webmasters', 'rew'],
    domains: ['realestatewebmasters.com'],
    jobPostingKeywords: ['real estate webmasters', 'rew', 'real estate website'],
    confidence: 80,
    description: 'Website and CRM solutions for real estate brokerages',
  },
  {
    id: 'zillow_premier_agent',
    name: 'Zillow Premier Agent',
    category: 'crm',
    keywords: ['zillow premier agent', 'premier agent'],
    domains: ['zillow.com', 'premieragent.com'],
    jobPostingKeywords: ['zillow', 'premier agent', 'zillow crm'],
    confidence: 85,
    description: 'Zillow\'s lead generation and CRM platform for agents',
  },
  {
    id: 'mls_com',
    name: 'MLS.com',
    category: 'mls',
    keywords: ['mls.com', 'mls'],
    domains: ['mls.com'],
    jobPostingKeywords: ['mls.com', 'mls integration', 'multiple listing service'],
    confidence: 90,
    description: 'National MLS aggregation platform',
  },
  {
    id: 'realtrac',
    name: 'RealTrac',
    category: 'mls',
    keywords: ['realtrac', 'real trac'],
    domains: ['realtrac.com'],
    jobPostingKeywords: ['realtrac', 'mls', 'real estate data'],
    confidence: 85,
    description: 'MLS data and real estate information platform',
  },
  {
    id: 'homesnap',
    name: 'Homesnap',
    category: 'crm',
    keywords: ['homesnap', 'home snap'],
    domains: ['homesnap.com'],
    jobPostingKeywords: ['homesnap', 'zillow homesnap', 'real estate app'],
    confidence: 80,
    description: 'Real estate platform with CRM and lead management',
  },
  {
    id: 'keller_williams_command',
    name: 'Keller Williams Command',
    category: 'crm',
    keywords: ['keller williams command', 'kwcommand', 'command'],
    domains: ['kwcommand.com'],
    jobPostingKeywords: ['keller williams command', 'kwcommand', 'kw command'],
    confidence: 90,
    description: 'Keller Williams proprietary CRM and transaction management platform',
  },
  {
    id: 're_max_cloud',
    name: 'RE/MAX Cloud',
    category: 'crm',
    keywords: ['re/max cloud', 'remax cloud', 'cloud'],
    domains: ['remaxcloud.com'],
    jobPostingKeywords: ['re/max cloud', 'remax cloud', 'cloud crm'],
    confidence: 85,
    description: 'RE/MAX proprietary CRM platform',
  },
  {
    id: 'century_21_platform',
    name: 'Century 21 Platform',
    category: 'crm',
    keywords: ['century 21', 'c21'],
    domains: ['century21.com'],
    jobPostingKeywords: ['century 21', 'c21', 'century 21 crm'],
    confidence: 80,
    description: 'Century 21 proprietary systems and CRM',
  },
  {
    id: 'coldwell_banker_platform',
    name: 'Coldwell Banker Platform',
    category: 'crm',
    keywords: ['coldwell banker', 'coldwell'],
    domains: ['coldwellbanker.com'],
    jobPostingKeywords: ['coldwell banker', 'coldwell', 'coldwell banker crm'],
    confidence: 80,
    description: 'Coldwell Banker proprietary systems',
  },
  {
    id: 'sothebys_international',
    name: 'Sotheby\'s International Realty',
    category: 'crm',
    keywords: ['sotheby', 'sothebys'],
    domains: ['sothebysrealty.com'],
    jobPostingKeywords: ['sotheby', 'sothebys', 'luxury real estate'],
    confidence: 75,
    description: 'Luxury real estate platform and systems',
  },
  {
    id: 'real_estate_express',
    name: 'Real Estate Express',
    category: 'crm',
    keywords: ['real estate express', 'express'],
    domains: ['realestateexpress.com'],
    jobPostingKeywords: ['real estate express', 'express crm'],
    confidence: 75,
    description: 'Real estate training and CRM platform',
  },
  {
    id: 'inside_real_estate',
    name: 'Inside Real Estate',
    category: 'crm',
    keywords: ['inside real estate', 'inside'],
    domains: ['insiderealestategroup.com'],
    jobPostingKeywords: ['inside real estate', 'inside group'],
    confidence: 75,
    description: 'Real estate technology and CRM solutions',
  },
  {
    id: 'real_geek',
    name: 'Real Geek',
    category: 'crm',
    keywords: ['real geek', 'realgeek'],
    domains: ['realgeek.com'],
    jobPostingKeywords: ['real geek', 'realgeek', 'real estate crm'],
    confidence: 80,
    description: 'Real estate CRM and lead management system',
  },
  {
    id: 'wise_agent',
    name: 'Wise Agent',
    category: 'crm',
    keywords: ['wise agent', 'wiseagent'],
    domains: ['wiseagent.com'],
    jobPostingKeywords: ['wise agent', 'wiseagent'],
    confidence: 80,
    description: 'Real estate CRM and transaction management',
  },
  {
    id: 'brokermint',
    name: 'BrokerMint',
    category: 'transaction_management',
    keywords: ['brokermint', 'broker mint'],
    domains: ['brokermint.com'],
    jobPostingKeywords: ['brokermint', 'transaction management', 'broker management'],
    confidence: 85,
    description: 'Broker management and transaction coordination platform',
  },
  {
    id: 'transaction_desk',
    name: 'Transaction Desk',
    category: 'transaction_management',
    keywords: ['transaction desk', 'transactiondesk'],
    domains: ['transactiondesk.com'],
    jobPostingKeywords: ['transaction desk', 'transactiondesk', 'transaction management'],
    confidence: 85,
    description: 'Transaction management and coordination platform',
  },
  {
    id: 'real_estate_one',
    name: 'Real Estate One',
    category: 'crm',
    keywords: ['real estate one', 'reone'],
    domains: ['reone.com'],
    jobPostingKeywords: ['real estate one', 'reone'],
    confidence: 75,
    description: 'Real estate CRM and business management',
  },
  {
    id: 'broker_brain',
    name: 'Broker Brain',
    category: 'crm',
    keywords: ['broker brain', 'brokerbrain'],
    domains: ['brokerbrain.com'],
    jobPostingKeywords: ['broker brain', 'brokerbrain'],
    confidence: 75,
    description: 'Broker management and agent support platform',
  },
];

/**
 * Search for platforms by keyword
 */
export function findPlatformsByKeyword(keyword: string): TransactionPlatform[] {
  const lowerKeyword = keyword.toLowerCase();
  return TRANSACTION_PLATFORMS.filter(platform =>
    platform.keywords.some(k => k.toLowerCase().includes(lowerKeyword)) ||
    platform.name.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Search for platforms by domain
 */
export function findPlatformsByDomain(domain: string): TransactionPlatform | undefined {
  const lowerDomain = domain.toLowerCase();
  return TRANSACTION_PLATFORMS.find(platform =>
    platform.domains.some(d => lowerDomain.includes(d.toLowerCase()))
  );
}

/**
 * Get all platforms by category
 */
export function getPlatformsByCategory(category: string): TransactionPlatform[] {
  return TRANSACTION_PLATFORMS.filter(p => p.category === category);
}

/**
 * Get all CRM platforms
 */
export function getCRMPlatforms(): TransactionPlatform[] {
  return getPlatformsByCategory('crm');
}

/**
 * Get all MLS platforms
 */
export function getMLSPlatforms(): TransactionPlatform[] {
  return getPlatformsByCategory('mls');
}

/**
 * Get all transaction management platforms
 */
export function getTransactionManagementPlatforms(): TransactionPlatform[] {
  return getPlatformsByCategory('transaction_management');
}

/**
 * Get all hybrid platforms
 */
export function getHybridPlatforms(): TransactionPlatform[] {
  return getPlatformsByCategory('hybrid');
}
