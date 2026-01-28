/**
 * Foot-in-the-Door Intelligence Service
 * 
 * Provides actionable intelligence for effective outreach:
 * - Recent news and achievements
 * - Pain points and challenges
 * - Warm intro paths
 * - Best timing for contact
 */

import axios from 'axios';

export interface FootInTheDoorIntel {
  recentNews: NewsItem[];
  achievements: Achievement[];
  painPoints: PainPoint[];
  warmIntroPaths: WarmIntroPath[];
  bestContactTiming: string;
  conversationStarters: string[];
}

export interface NewsItem {
  title: string;
  date?: string;
  source: string;
  url?: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface Achievement {
  type: 'award' | 'expansion' | 'milestone' | 'hire' | 'other';
  description: string;
  date?: string;
  source: string;
}

export interface PainPoint {
  category: 'technology' | 'operations' | 'growth' | 'compliance' | 'other';
  description: string;
  source: string;
  severity: 'high' | 'medium' | 'low';
}

export interface WarmIntroPath {
  contactName: string;
  relationship: string;
  platform: 'linkedin' | 'association' | 'mutual_contact' | 'other';
  confidence: number;
}

/**
 * Gather foot-in-the-door intelligence for a business
 */
export async function gatherFootInTheDoorIntel(params: {
  businessName: string;
  location?: string;
  websiteText?: string;
}): Promise<FootInTheDoorIntel> {
  const { businessName, location } = params;
  
  console.log(`[FootInTheDoor] Gathering intelligence for ${businessName}`);
  
  // Search for recent news
  const recentNews = await searchRecentNews(businessName, location);
  
  // Extract achievements from news
  const achievements = extractAchievements(recentNews);
  
  // Search for pain points (reviews, complaints, forum posts)
  const painPoints = await searchPainPoints(businessName);
  
  // Generate conversation starters based on intelligence
  const conversationStarters = generateConversationStarters({
    businessName,
    recentNews,
    achievements,
    painPoints,
  });
  
  return {
    recentNews,
    achievements,
    painPoints,
    warmIntroPaths: [], // LinkedIn scraping would populate this
    bestContactTiming: determineBestTiming(),
    conversationStarters,
  };
}

/**
 * Search for recent news about the business
 */
async function searchRecentNews(
  businessName: string,
  location?: string
): Promise<NewsItem[]> {
  try {
    const query = location 
      ? `"${businessName}" ${location} real estate news`
      : `"${businessName}" real estate news`;
    
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!forgeApiUrl || !forgeApiKey) {
      console.warn('[FootInTheDoor] Forge API not configured');
      return [];
    }
    
    const response = await axios.post(
      `${forgeApiUrl}/omni_search`,
      {
        queries: [query],
        search_type: 'news',
        time: 'past_month',
      },
      {
        headers: {
          'Authorization': `Bearer ${forgeApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    
    const results = response.data?.results || [];
    const newsItems: NewsItem[] = [];
    
    for (const result of results.slice(0, 5)) {
      newsItems.push({
        title: result.title || '',
        date: result.date,
        source: result.source || 'Unknown',
        url: result.url,
        relevance: determineRelevance(result.title, result.snippet),
      });
    }
    
    console.log(`[FootInTheDoor] Found ${newsItems.length} recent news items`);
    return newsItems;
  } catch (error) {
    console.error('[FootInTheDoor] News search failed:', error);
    return [];
  }
}

/**
 * Extract achievements from news items
 */
function extractAchievements(newsItems: NewsItem[]): Achievement[] {
  const achievements: Achievement[] = [];
  
  const achievementPatterns: Array<{
    type: Achievement['type'];
    pattern: RegExp;
  }> = [
    { type: 'award', pattern: /\b(award|honor|recognition|top producer|best|excellence)\b/i },
    { type: 'expansion', pattern: /\b(expand|new office|opening|growth|acquisition)\b/i },
    { type: 'milestone', pattern: /\b(milestone|anniversary|record|achievement)\b/i },
    { type: 'hire', pattern: /\b(hire|join|appoint|welcome|new agent)\b/i },
  ];
  
  for (const news of newsItems) {
    const text = `${news.title} ${news.source}`;
    
    for (const { type, pattern } of achievementPatterns) {
      if (pattern.test(text)) {
        achievements.push({
          type,
          description: news.title,
          date: news.date,
          source: news.source,
        });
        break; // Only one achievement type per news item
      }
    }
  }
  
  return achievements;
}

/**
 * Search for pain points (reviews, complaints, challenges)
 */
async function searchPainPoints(businessName: string): Promise<PainPoint[]> {
  try {
    const queries = [
      `"${businessName}" review complaints`,
      `"${businessName}" problems issues`,
      `"${businessName}" technology challenges`,
    ];
    
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!forgeApiUrl || !forgeApiKey) {
      return [];
    }
    
    const response = await axios.post(
      `${forgeApiUrl}/omni_search`,
      {
        queries,
        search_type: 'info',
      },
      {
        headers: {
          'Authorization': `Bearer ${forgeApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    
    const results = response.data?.results || [];
    const painPoints: PainPoint[] = [];
    
    const painPointPatterns: Array<{
      category: PainPoint['category'];
      pattern: RegExp;
      severity: PainPoint['severity'];
    }> = [
      { category: 'technology', pattern: /\b(software|system|crm|tech|platform|tool)\b/i, severity: 'high' },
      { category: 'operations', pattern: /\b(process|workflow|efficiency|coordination)\b/i, severity: 'medium' },
      { category: 'growth', pattern: /\b(scale|grow|expand|hire|agent)\b/i, severity: 'medium' },
      { category: 'compliance', pattern: /\b(compliance|regulation|legal|audit)\b/i, severity: 'high' },
    ];
    
    for (const result of results.slice(0, 10)) {
      const text = `${result.title} ${result.snippet || ''}`;
      
      // Look for negative sentiment
      if (/\b(problem|issue|challenge|difficult|frustrat|complain)\b/i.test(text)) {
        for (const { category, pattern, severity } of painPointPatterns) {
          if (pattern.test(text)) {
            painPoints.push({
              category,
              description: result.snippet || result.title,
              source: result.source || 'Web',
              severity,
            });
            break;
          }
        }
      }
    }
    
    console.log(`[FootInTheDoor] Identified ${painPoints.length} potential pain points`);
    return painPoints;
  } catch (error) {
    console.error('[FootInTheDoor] Pain point search failed:', error);
    return [];
  }
}

/**
 * Determine relevance of news item
 */
function determineRelevance(title: string, snippet?: string): NewsItem['relevance'] {
  const text = `${title} ${snippet || ''}`.toLowerCase();
  
  // High relevance: awards, expansions, major announcements
  if (/\b(award|expansion|acquisition|partnership|launch)\b/i.test(text)) {
    return 'high';
  }
  
  // Medium relevance: general business news
  if (/\b(announce|new|update|change)\b/i.test(text)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Determine best timing for contact
 */
function determineBestTiming(): string {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Avoid weekends
  if (day === 0 || day === 6) {
    return 'Monday morning (9-11 AM)';
  }
  
  // Best times: Tuesday-Thursday, 9-11 AM or 2-4 PM
  if (day >= 2 && day <= 4) {
    if (hour >= 9 && hour < 11) {
      return 'Now (optimal time)';
    } else if (hour >= 14 && hour < 16) {
      return 'Now (good time)';
    }
  }
  
  return 'Tuesday-Thursday, 9-11 AM or 2-4 PM';
}

/**
 * Generate conversation starters based on intelligence
 */
function generateConversationStarters(params: {
  businessName: string;
  recentNews: NewsItem[];
  achievements: Achievement[];
  painPoints: PainPoint[];
}): string[] {
  const { businessName, recentNews, achievements, painPoints } = params;
  const starters: string[] = [];
  
  // Achievement-based starters
  if (achievements.length > 0) {
    const achievement = achievements[0];
    if (achievement.type === 'award') {
      starters.push(`Congratulations on your recent award! I'd love to discuss how we can support your continued success.`);
    } else if (achievement.type === 'expansion') {
      starters.push(`I saw you're expanding - exciting times! Let's talk about how our platform can streamline your growth.`);
    } else if (achievement.type === 'hire') {
      starters.push(`Welcome to your new team members! As you scale, our tools can help onboard agents faster.`);
    }
  }
  
  // News-based starters
  if (recentNews.length > 0 && recentNews[0]?.relevance === 'high') {
    starters.push(`I came across your recent announcement - impressive! I'd like to share how we're helping similar brokerages.`);
  }
  
  // Pain point-based starters
  if (painPoints.length > 0) {
    const techPainPoints = painPoints.filter(p => p.category === 'technology');
    if (techPainPoints.length > 0) {
      starters.push(`I noticed some challenges with your current tech stack. Let's explore how dotloop can simplify your workflow.`);
    }
  }
  
  // Generic but personalized starter
  starters.push(`Hi! I work with ${businessName.includes('Realty') ? 'brokerages like yours' : 'real estate teams'} to streamline transactions. Do you have 15 minutes this week?`);
  
  return starters.slice(0, 3); // Return top 3
}
