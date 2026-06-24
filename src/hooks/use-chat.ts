'use client';

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../store';
import type { Chat, Message, CreateChatInput, StreamCallbacks } from '../types';

const CHATS_KEY = 'chats';
const MESSAGES_KEY = (chatId: string) => ['chats', chatId, 'messages'];

async function fetchChats(projectId?: string): Promise<Chat[]> {
  const params = projectId ? `?projectId=${projectId}` : '';
  const response = await fetch(`/api/chat${params}`);
  if (!response.ok) throw new Error('Failed to fetch chats');
  return response.json();
}

async function fetchChat(id: string): Promise<Chat> {
  const response = await fetch(`/api/chat/${id}`);
  if (!response.ok) throw new Error('Failed to fetch chat');
  return response.json();
}

async function fetchMessages(chatId: string): Promise<Message[]> {
  const response = await fetch(`/api/chat/${chatId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

async function createChat(data: CreateChatInput): Promise<Chat> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create chat');
  return response.json();
}

async function deleteChat(id: string): Promise<void> {
  const response = await fetch(`/api/chat/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete chat');
}

export function useChats(projectId?: string) {
  const { setChats } = useChatStore();

  const query = useQuery({
    queryKey: [CHATS_KEY, projectId],
    queryFn: () => fetchChats(projectId),
    staleTime: 30 * 1000,
  });

  if (query.data) {
    setChats(query.data);
  }

  return query;
}

export function useChat(chatId: string) {
  const { setActiveChat, setMessages } = useChatStore();

  const chatQuery = useQuery({
    queryKey: ['chats', chatId],
    queryFn: () => fetchChat(chatId),
    enabled: !!chatId,
  });

  const messagesQuery = useQuery({
    queryKey: MESSAGES_KEY(chatId),
    queryFn: () => fetchMessages(chatId),
    enabled: !!chatId,
    staleTime: 0,
  });

  if (chatQuery.data) {
    setActiveChat(chatQuery.data);
  }

  if (messagesQuery.data) {
    setMessages(messagesQuery.data);
  }

  return {
    chat: chatQuery.data,
    messages: messagesQuery.data ?? [],
    isLoading: chatQuery.isLoading || messagesQuery.isLoading,
    error: chatQuery.error || messagesQuery.error,
  };
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  const { addChat, setActiveChat } = useChatStore();

  return useMutation({
    mutationFn: createChat,
    onSuccess: (newChat) => {
      queryClient.invalidateQueries({ queryKey: [CHATS_KEY] });
      addChat(newChat);
      setActiveChat(newChat);
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  const { removeChat, activeChat, setActiveChat } = useChatStore();

  return useMutation({
    mutationFn: deleteChat,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: [CHATS_KEY] });
      queryClient.removeQueries({ queryKey: MESSAGES_KEY(deletedId) });
      removeChat(deletedId);
      if (activeChat?.id === deletedId) {
        setActiveChat(null);
      }
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const {
    addMessage,
    updateMessage,
    setStreaming,
    appendStreamChunk,
    activeChat,
  } = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, callbacks?: StreamCallbacks) => {
      if (!activeChat) throw new Error('No active chat');

      abortControllerRef.current = new AbortController();

      const userMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chatId: activeChat.id,
        role: 'user',
        content,
        status: 'completed',
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 },
        toolCalls: [],
        toolResults: [],
        metadata: {
          model: '',
          provider: '',
          latencyMs: 0,
          cached: false,
        },
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addMessage(userMessage);

      const assistantMessageId = `msg-${Date.now()}-assistant`;

      const assistantMessage: Message = {
        id: assistantMessageId,
        chatId: activeChat.id,
        role: 'assistant',
        content: '',
        status: 'streaming',
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0 },
        toolCalls: [],
        toolResults: [],
        metadata: {
          model: activeChat.modelId,
          provider: activeChat.providerId,
          latencyMs: 0,
          cached: false,
        },
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addMessage(assistantMessage);
      setStreaming(true, assistantMessageId);

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChat.id,
            messages: [userMessage],
            modelId: activeChat.modelId,
            providerId: activeChat.providerId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) throw new Error('Failed to send message');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

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
                  appendStreamChunk(assistantMessageId, chunk.content);
                  callbacks?.onChunk(chunk.content);
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }

        updateMessage(assistantMessageId, { status: 'completed' });
        setStreaming(false);

        queryClient.invalidateQueries({ queryKey: MESSAGES_KEY(activeChat.id) });

        callbacks?.onComplete(
          useChatStore.getState().messages.find((m) => m.id === assistantMessageId)!
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          updateMessage(assistantMessageId, { status: 'cancelled' });
        } else {
          updateMessage(assistantMessageId, {
            status: 'error',
            content: error instanceof Error ? error.message : 'Failed to get response',
          });
          callbacks?.onError(error instanceof Error ? error : new Error('Unknown error'));
        }
        setStreaming(false);
      }
    },
    [activeChat, addMessage, updateMessage, setStreaming, appendStreamChunk, queryClient]
  );

  const cancelMessage = useCallback(() => {
    abortControllerRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  return { sendMessage, cancelMessage };
}
