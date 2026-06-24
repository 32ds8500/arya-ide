import { create } from 'zustand';
import type { Chat, Message, SendMessageInput } from '../types';

interface ChatStore {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;

  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  setActiveChat: (chat: Chat | null) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  pinChat: (chatId: string) => void;
  unpinChat: (chatId: string) => void;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;

  setStreaming: (isStreaming: boolean, messageId?: string) => void;
  appendStreamChunk: (messageId: string, content: string) => void;

  setError: (error: string | null) => void;
  clearError: () => void;
  clearChat: () => void;

  getActiveMessages: () => Message[];
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  isStreaming: false,
  streamingMessageId: null,
  error: null,

  setChats: (chats) => set({ chats }),

  addChat: (chat) => {
    set((state) => ({ chats: [chat, ...state.chats] }));
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat, messages: [], error: null });
  },

  updateChat: (chatId, updates) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      ),
      activeChat:
        state.activeChat?.id === chatId
          ? { ...state.activeChat, ...updates }
          : state.activeChat,
    }));
  },

  removeChat: (chatId) => {
    set((state) => ({
      chats: state.chats.filter((chat) => chat.id !== chatId),
      activeChat:
        state.activeChat?.id === chatId ? null : state.activeChat,
    }));
  },

  pinChat: (chatId) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, isPinned: true } : chat
      ),
    }));
  },

  unpinChat: (chatId) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, isPinned: false } : chat
      ),
    }));
  },

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      chats: state.chats.map((chat) =>
        chat.id === message.chatId
          ? {
              ...chat,
              messageCount: chat.messageCount + 1,
              lastMessageAt: message.createdAt,
            }
          : chat
      ),
    }));
  },

  updateMessage: (messageId, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }));
  },

  removeMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    }));
  },

  clearMessages: () => set({ messages: [] }),

  setStreaming: (isStreaming, messageId) => {
    set({
      isStreaming,
      streamingMessageId: isStreaming ? (messageId ?? null) : null,
    });
  },

  appendStreamChunk: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: msg.content + content }
          : msg
      ),
    }));
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  clearChat: () =>
    set({
      messages: [],
      isStreaming: false,
      streamingMessageId: null,
      error: null,
    }),

  getActiveMessages: () => {
    const { activeChat, messages } = get();
    if (!activeChat) return [];
    return messages.filter((msg) => msg.chatId === activeChat.id);
  },
}));
