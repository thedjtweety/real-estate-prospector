// Replaced Manus LLM with Groq (free: 14,400 requests/day)
import { invokeGroq, parseJSONFromLLM } from "./groqLLM";

export interface ContactMatch {
  name: string;
  title?: string;
  role: "broker" | "owner" | "office_manager" | "admin" | "transaction_coordinator" | "technology_poc" | "other";
  email?: string;
  phone?: string;
  confidence: number;
  reasoning: string;
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  confidence: number;
  reasoning: string;
  matchedContactId?: number;
}

/**
 * Use LLM to categorize contact role based on title and context
 */
export async function categorizeContactRole(params: {
  name: string;
  title?: string;
  companyName?: string;
  additionalContext?: string;
}): Promise<{ role: ContactMatch["role"]; confidence: number; reasoning: string }> {
  const prompt = `You are analyzing a contact at a real estate brokerage to determine their role.

Contact Information:
- Name: ${params.name}
- Title: ${params.title || "Unknown"}
- Company: ${params.companyName || "Unknown"}
${params.additionalContext ? `- Additional Context: ${params.additionalContext}` : ""}

Based on the title and context, categorize this person into ONE of these roles:
- broker: Licensed real estate broker or agent
- owner: Owner or principal of the brokerage
- office_manager: Office manager or operations manager
- admin: Administrative assistant or support staff
- transaction_coordinator: Transaction coordinator or closing coordinator
- technology_poc: Technology point of contact, IT manager, or CTO
- other: Any other role

Respond in JSON format:
{
  "role": "one of the roles above",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of why you chose this role"
}`;

  try {
    // Note: Groq doesn't support response_format with json_schema, using prompt engineering instead
    const response = await invokeGroq({
      messages: [
        { role: "system", content: "You are an expert at analyzing real estate business contacts and categorizing their roles. Always respond with valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const result = parseJSONFromLLM(content);
    return result;
  } catch (error) {
    console.error("LLM categorization error:", error);
    // Fallback to basic categorization
    return fallbackRoleCategorization(params.title || "");
  }
}

/**
 * Fallback role categorization using simple keyword matching
 */
function fallbackRoleCategorization(title: string): { role: ContactMatch["role"]; confidence: number; reasoning: string } {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("broker") || lowerTitle.includes("agent")) {
    return { role: "broker", confidence: 0.7, reasoning: "Title contains 'broker' or 'agent'" };
  }
  if (lowerTitle.includes("owner") || lowerTitle.includes("principal") || lowerTitle.includes("ceo") || lowerTitle.includes("president")) {
    return { role: "owner", confidence: 0.7, reasoning: "Title suggests ownership or leadership" };
  }
  if (lowerTitle.includes("office manager") || lowerTitle.includes("operations")) {
    return { role: "office_manager", confidence: 0.7, reasoning: "Title suggests office management" };
  }
  if (lowerTitle.includes("transaction") || lowerTitle.includes("closing")) {
    return { role: "transaction_coordinator", confidence: 0.7, reasoning: "Title suggests transaction coordination" };
  }
  if (lowerTitle.includes("technology") || lowerTitle.includes("it") || lowerTitle.includes("cto")) {
    return { role: "technology_poc", confidence: 0.7, reasoning: "Title suggests technology role" };
  }
  if (lowerTitle.includes("admin") || lowerTitle.includes("assistant") || lowerTitle.includes("secretary")) {
    return { role: "admin", confidence: 0.7, reasoning: "Title suggests administrative role" };
  }

  return { role: "other", confidence: 0.3, reasoning: "Could not determine specific role from title" };
}

/**
 * Use LLM to detect duplicate contacts
 */
export async function detectDuplicateContact(params: {
  newContact: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  existingContacts: Array<{
    id: number;
    name: string;
    title?: string;
    email?: string;
    phone?: string;
  }>;
}): Promise<DeduplicationResult> {
  if (params.existingContacts.length === 0) {
    return {
      isDuplicate: false,
      confidence: 1.0,
      reasoning: "No existing contacts to compare",
    };
  }

  const prompt = `You are analyzing whether a new contact is a duplicate of existing contacts in a database.

New Contact:
- Name: ${params.newContact.name}
- Title: ${params.newContact.title || "Unknown"}
- Email: ${params.newContact.email || "Unknown"}
- Phone: ${params.newContact.phone || "Unknown"}

Existing Contacts:
${params.existingContacts.map((c, i) => `${i + 1}. Name: ${c.name}, Title: ${c.title || "Unknown"}, Email: ${c.email || "Unknown"}, Phone: ${c.phone || "Unknown"} (ID: ${c.id})`).join("\n")}

Determine if the new contact is a duplicate of any existing contact. Consider:
- Name similarity (accounting for nicknames, middle names, etc.)
- Email and phone matches
- Title similarity

Respond in JSON format:
{
  "isDuplicate": true or false,
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation",
  "matchedContactId": ID of matched contact or null
}`;

  try {
    const response = await invokeGroq({
      messages: [
        { role: "system", content: "You are an expert at detecting duplicate contacts and matching people across different data sources. Always respond with valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const result = parseJSONFromLLM(content);
    return result;
  } catch (error) {
    console.error("LLM deduplication error:", error);
    // Fallback to simple matching
    return fallbackDuplicateDetection(params.newContact, params.existingContacts);
  }
}

/**
 * Fallback duplicate detection using exact matching
 */
function fallbackDuplicateDetection(
  newContact: { name: string; email?: string; phone?: string },
  existingContacts: Array<{ id: number; name: string; email?: string; phone?: string }>
): DeduplicationResult {
  // Check for exact email match
  if (newContact.email) {
    const emailMatch = existingContacts.find(c => c.email?.toLowerCase() === newContact.email?.toLowerCase());
    if (emailMatch) {
      return {
        isDuplicate: true,
        confidence: 0.95,
        reasoning: "Exact email match found",
        matchedContactId: emailMatch.id,
      };
    }
  }

  // Check for exact phone match
  if (newContact.phone) {
    const normalizedNewPhone = newContact.phone.replace(/\D/g, "");
    const phoneMatch = existingContacts.find(c => {
      if (!c.phone) return false;
      const normalizedExistingPhone = c.phone.replace(/\D/g, "");
      return normalizedExistingPhone === normalizedNewPhone;
    });
    if (phoneMatch) {
      return {
        isDuplicate: true,
        confidence: 0.9,
        reasoning: "Exact phone match found",
        matchedContactId: phoneMatch.id,
      };
    }
  }

  // Check for exact name match
  const nameMatch = existingContacts.find(c => c.name.toLowerCase() === newContact.name.toLowerCase());
  if (nameMatch) {
    return {
      isDuplicate: true,
      confidence: 0.7,
      reasoning: "Exact name match found",
      matchedContactId: nameMatch.id,
    };
  }

  return {
    isDuplicate: false,
    confidence: 0.8,
    reasoning: "No matches found",
  };
}

/**
 * Infer missing contact details from partial information
 */
export async function inferMissingDetails(params: {
  name: string;
  title?: string;
  companyName: string;
  partialEmail?: string;
  partialPhone?: string;
  additionalContext?: string;
}): Promise<{
  inferredEmail?: string;
  inferredPhone?: string;
  confidence: number;
  reasoning: string;
}> {
  const prompt = `You are analyzing a contact at a real estate brokerage to infer missing contact details.

Contact Information:
- Name: ${params.name}
- Title: ${params.title || "Unknown"}
- Company: ${params.companyName}
${params.partialEmail ? `- Partial Email: ${params.partialEmail}` : ""}
${params.partialPhone ? `- Partial Phone: ${params.partialPhone}` : ""}
${params.additionalContext ? `- Additional Context: ${params.additionalContext}` : ""}

Based on the information provided, try to infer:
1. A likely email format (if not provided)
2. A complete phone number (if partial)

Common email patterns for real estate:
- firstname@company.com
- firstname.lastname@company.com
- flastname@company.com

Respond in JSON format:
{
  "inferredEmail": "email or null",
  "inferredPhone": "phone or null",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;

  try {
    const response = await invokeGroq({
      messages: [
        { role: "system", content: "You are an expert at inferring contact information based on partial data and common patterns. Always respond with valid JSON only, no markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const result = parseJSONFromLLM(content);
    return result;
  } catch (error) {
    console.error("LLM inference error:", error);
    return {
      confidence: 0,
      reasoning: "Could not infer missing details",
    };
  }
}
