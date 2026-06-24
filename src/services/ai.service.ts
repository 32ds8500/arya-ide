import OpenAI from "openai";
import { modelService } from "./model.service";
import { redisService } from "./redis.service";
import { logService } from "./log.service";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export interface AgentTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "o1": { input: 15, output: 60 },
  "o1-mini": { input: 3, output: 12 },
  "o3-mini": { input: 1.1, output: 4.4 },
};

export const aiService = {
  async chat(options: ChatOptions) {
    const startTime = Date.now();
    try {
      const response = await client.chat.completions.create({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      });

      const choice = response.choices[0];
      const usage = response.usage;

      await logService.info("ai.chat", {
        model: options.model,
        tokens: usage?.total_tokens,
        latencyMs: Date.now() - startTime,
      });

      return {
        content: choice.message.content ?? "",
        tokens: usage?.total_tokens ?? 0,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        model: response.model,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      await logService.error("ai.chat", error as Error, { model: options.model });
      throw error;
    }
  },

  async *stream(options: ChatOptions, callbacks?: StreamCallbacks) {
    const startTime = Date.now();
    try {
      const stream = await client.chat.completions.create({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      });

      let fullText = "";

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) {
          fullText += token;
          callbacks?.onToken?.(token);
          yield token;
        }
      }

      await logService.info("ai.stream", {
        model: options.model,
        length: fullText.length,
        latencyMs: Date.now() - startTime,
      });

      callbacks?.onDone?.(fullText);
    } catch (error) {
      callbacks?.onError?.(error as Error);
      await logService.error("ai.stream", error as Error, { model: options.model });
      throw error;
    }
  },

  async agent(options: ChatOptions, tools: AgentTool[]) {
    const allMessages: ChatMessage[] = [...options.messages];
    const toolResults: unknown[] = [];

    while (true) {
      const response = await client.chat.completions.create({
        model: options.model,
        messages: allMessages,
        tools,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4096,
      });

      const choice = response.choices[0];

      if (choice.finish_reason === "stop") {
        return {
          content: choice.message.content ?? "",
          toolCalls: toolResults,
          tokens: response.usage?.total_tokens ?? 0,
        };
      }

      if (choice.message.tool_calls) {
          allMessages.push({
            role: "assistant",
            content: choice.message.content ?? "",
          } as ChatMessage);

        for (const toolCall of choice.message.tool_calls) {
          toolResults.push({
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
          });

          allMessages.push({
            role: "assistant",
            content: `Tool call: ${toolCall.function.name}(${toolCall.function.arguments})`,
          } as ChatMessage);
        }
      }
    }
  },

  async countTokens(text: string, model: string = "gpt-4o") {
    try {
      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return Math.ceil(text.length / 4);
    } catch {
      return Math.ceil(text.length / 4);
    }
  },

  estimateCost(promptTokens: number, completionTokens: number, model: string) {
    const pricing = TOKEN_PRICING[model] ?? TOKEN_PRICING["gpt-4o"];
    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: "USD",
    };
  },
};
