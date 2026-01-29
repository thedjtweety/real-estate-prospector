/**
 * Groq LLM Integration
 * 
 * Free tier: 14,400 requests/day, 30 requests/minute
 * Speed: 500+ tokens/second (fastest available)
 * Models: Llama 3.1 70B, Mixtral 8x7B
 * 
 * Drop-in replacement for Manus LLM to avoid credit costs
 */

import axios from 'axios';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Groq API with OpenAI-compatible interface
 */
export async function invokeGroq(params: {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}): Promise<GroqResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not found in environment variables');
  }

  const {
    messages,
    model = 'llama-3.1-70b-versatile', // Default to Llama 3.1 70B
    temperature = 0.1, // Low temp for factual accuracy
    max_tokens = 2000,
  } = params;

  try {
    console.log(`[Groq] Calling ${model} with ${messages.length} messages`);
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    console.log(`[Groq] Response received (${response.data.usage.total_tokens} tokens)`);
    return response.data;
    
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('[Groq] Authentication failed - check your GROQ_API_KEY');
    } else if (error.response?.status === 429) {
      console.error('[Groq] Rate limit exceeded (30 requests/minute or 14,400/day)');
    } else if (error.response?.status === 400) {
      console.error('[Groq] Bad request (400):', JSON.stringify(error.response?.data, null, 2));
      console.error('[Groq] Request body was:', JSON.stringify({ model, messages, temperature, max_tokens }, null, 2));
    } else {
      console.error('[Groq] API call failed:', error.message);
      if (error.response?.data) {
        console.error('[Groq] Error details:', JSON.stringify(error.response.data, null, 2));
      }
    }
    throw error;
  }
}

/**
 * Parse JSON from LLM response (handles markdown code blocks)
 */
export function parseJSONFromLLM(content: string): any {
  // Remove markdown code blocks if present
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('[Groq] Failed to parse JSON:', cleaned.substring(0, 200));
    throw new Error('Invalid JSON response from LLM');
  }
}

/**
 * Simplified interface matching Manus invokeLLM
 */
export async function invokeGroqSimple(params: {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
}): Promise<{ content: string }> {
  const response = await invokeGroq({
    messages: params.messages as GroqMessage[],
    temperature: params.temperature,
  });
  
  return {
    content: response.choices[0].message.content,
  };
}
