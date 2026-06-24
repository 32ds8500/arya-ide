'use client';

import { useCallback, useRef } from 'react';
import { useChatStore, useModelStore } from '../store';
import type { ToolCall, ToolResult, AIAgentConfig } from '../types';

interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

interface AgentResponse {
  content: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  finishReason: string;
}

interface UseAgentOptions {
  config?: Partial<AIAgentConfig>;
  onToolCall?: (toolCall: ToolCall) => void;
  onToolResult?: (result: ToolResult) => void;
  onStream?: (chunk: string) => void;
}

export function useAgent(options: UseAgentOptions = {}) {
  const { setStreaming, appendStreamChunk } = useChatStore();
  const { selectedProvider, selectedModel } = useModelStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<AgentMessage[]>([]);

  const defaultConfig: AIAgentConfig = {
    modelId: selectedModel || 'gpt-4',
    providerId: selectedProvider || 'openai',
    temperature: 0.7,
    maxTokens: 4096,
    tools: [],
    systemPrompt: 'You are a helpful AI coding assistant.',
    maxIterations: 10,
    timeout: 60000,
  };

  const config = { ...defaultConfig, ...options.config };

  const executeTool = useCallback(
    async (toolCall: ToolCall): Promise<ToolResult> => {
      try {
        const response = await fetch('/api/agent/tools/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName: toolCall.function.name,
            arguments: toolCall.function.parsedArguments || JSON.parse(toolCall.function.arguments),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            toolCallId: toolCall.id,
            content: JSON.stringify({ error: error.message }),
            isError: true,
          };
        }

        const result = await response.json();
        return {
          toolCallId: toolCall.id,
          content: JSON.stringify(result),
          isError: false,
        };
      } catch (error) {
        return {
          toolCallId: toolCall.id,
          content: JSON.stringify({
            error: error instanceof Error ? error.message : 'Tool execution failed',
          }),
          isError: true,
        };
      }
    },
    []
  );

  const runAgent = useCallback(
    async (userMessage: string): Promise<AgentResponse> => {
      abortControllerRef.current = new AbortController();

      const userMsg: AgentMessage = { role: 'user', content: userMessage };
      messagesRef.current.push(userMsg);

      let iterations = 0;
      let finalContent = '';
      const allToolCalls: ToolCall[] = [];
      const allToolResults: ToolResult[] = [];

      while (iterations < config.maxIterations) {
        iterations++;

        try {
          const response = await fetch('/api/agent/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: config.systemPrompt },
                ...messagesRef.current,
              ],
              modelId: config.modelId,
              providerId: config.providerId,
              temperature: config.temperature,
              maxTokens: config.maxTokens,
              tools: config.tools,
              stream: true,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) throw new Error('Agent request failed');

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buffer = '';
          let content = '';
          const toolCalls: ToolCall[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                  const chunk = JSON.parse(data);
                  if (chunk.content) {
                    content += chunk.content;
                    options.onStream?.(chunk.content);
                  }
                  if (chunk.toolCalls) {
                    toolCalls.push(...chunk.toolCalls);
                  }
                } catch {
                  // Skip malformed chunks
                }
              }
            }
          }

          if (toolCalls.length > 0) {
            const assistantMsg: AgentMessage = {
              role: 'assistant',
              content,
              toolCalls,
            };
            messagesRef.current.push(assistantMsg);

            const toolResults: ToolResult[] = [];
            for (const toolCall of toolCalls) {
              options.onToolCall?.(toolCall);
              const result = await executeTool(toolCall);
              toolResults.push(result);
              options.onToolResult?.(result);
            }

            const toolResultsMsg: AgentMessage = {
              role: 'tool',
              content: toolResults.map((r) => r.content).join('\n'),
              toolResults,
            };
            messagesRef.current.push(toolResultsMsg);

            allToolCalls.push(...toolCalls);
            allToolResults.push(...toolResults);
          } else {
            finalContent = content;
            const assistantMsg: AgentMessage = { role: 'assistant', content };
            messagesRef.current.push(assistantMsg);
            break;
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
          }
          throw error;
        }
      }

      return {
        content: finalContent,
        toolCalls: allToolCalls,
        toolResults: allToolResults,
        finishReason: iterations >= config.maxIterations ? 'max_iterations' : 'stop',
      };
    },
    [config, executeTool, options]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      return runAgent(content);
    },
    [runAgent]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  const reset = useCallback(() => {
    messagesRef.current = [];
    abortControllerRef.current = null;
  }, []);

  return {
    sendMessage,
    abort,
    reset,
    messages: messagesRef,
  };
}
