import { describe, it, expect } from 'vitest';
import { invokeGroq, parseJSONFromLLM } from './groqLLM';

describe('Groq LLM Integration', () => {
  it('should successfully call Groq API with valid key', async () => {
    const response = await invokeGroq({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "test successful" and nothing else.' },
      ],
      temperature: 0.1,
      max_tokens: 50,
    });
    
    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message.content).toBeDefined();
    expect(response.usage).toBeDefined();
    expect(response.usage.total_tokens).toBeGreaterThan(0);
  }, 30000);
});
