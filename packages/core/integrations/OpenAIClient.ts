/**
 * Configuration for OpenAI client
 */
export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

/**
 * OpenAI API response types
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletion {
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Client for interacting with OpenAI API
 */
export class OpenAIClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  /**
   * Generates a completion using chat API
   */
  async generateCompletion(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<{ content: string; tokensUsed: number }> {
    const url = `${this.baseUrl}/chat/completions`;

    const response = await this.fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 2000
      })
    });

    const completion = response as ChatCompletion;

    return {
      content: completion.choices[0]?.message.content || '',
      tokensUsed: completion.usage.total_tokens
    };
  }

  /**
   * Generates a test fix using AI
   */
  async generateTestFix(
    testFile: string,
    errorMessage: string,
    stackTrace: string,
    codeDiff?: string
  ): Promise<{ fixedCode: string; explanation: string; tokensUsed: number }> {
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are an expert at fixing JavaScript and TypeScript test failures.
Your task is to analyze test failures and provide corrected code.
Always return valid, working code that will pass the tests.
Focus on:
- Snapshot updates
- Assertion value corrections
- Mock adjustments
- Property name changes
- Type fixes`
    };

    const userPrompt: ChatMessage = {
      role: 'user',
      content: this.buildFixPrompt(testFile, errorMessage, stackTrace, codeDiff)
    };

    const result = await this.generateCompletion([systemPrompt, userPrompt], {
      temperature: 0.2, // Lower temperature for more deterministic fixes
      maxTokens: 3000
    });

    // Parse response to extract code and explanation
    const { code, explanation } = this.parseFixResponse(result.content);

    return {
      fixedCode: code,
      explanation,
      tokensUsed: result.tokensUsed
    };
  }

  /**
   * Builds the prompt for test fixing
   */
  private buildFixPrompt(
    testFile: string,
    errorMessage: string,
    stackTrace: string,
    codeDiff?: string
  ): string {
    let prompt = `## Test Failure Analysis\n\n`;
    prompt += `**Error Message:**\n${errorMessage}\n\n`;
    prompt += `**Stack Trace:**\n${stackTrace}\n\n`;

    if (codeDiff) {
      prompt += `**Recent Code Changes:**\n\`\`\`diff\n${codeDiff}\n\`\`\`\n\n`;
    }

    prompt += `**Current Test File:**\n\`\`\`typescript\n${testFile}\n\`\`\`\n\n`;
    prompt += `Please provide:\n`;
    prompt += `1. The corrected test file code (complete file)\n`;
    prompt += `2. A brief explanation of what was fixed\n\n`;
    prompt += `Format your response as:\n`;
    prompt += `FIXED_CODE:\n\`\`\`typescript\n[code here]\n\`\`\`\n\n`;
    prompt += `EXPLANATION:\n[explanation here]`;

    return prompt;
  }

  /**
   * Parses the AI response to extract code and explanation
   */
  private parseFixResponse(response: string): { code: string; explanation: string } {
    const codeMatch = response.match(/FIXED_CODE:\s*```(?:typescript|javascript)?\s*([\s\S]*?)```/i);
    const explanationMatch = response.match(/EXPLANATION:\s*([\s\S]*?)$/i);

    return {
      code: codeMatch?.[1]?.trim() || response,
      explanation: explanationMatch?.[1]?.trim() || 'AI-generated fix applied'
    };
  }

  /**
   * Generic fetch helper with auth
   */
  private async fetch(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    return response.json();
  }
}
