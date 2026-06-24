'use client'

import { useState, useRef, useEffect } from 'react'
import { useChats, useCreateChat, useDeleteChat, useSendMessage } from '@/hooks/use-chat'
import { useChatStore } from '@/store/chat-store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Plus, Send, Paperclip, Bot, User, Sparkles, Settings, Trash2, Loader2 } from 'lucide-react'

const models = [
  { id: 'ollama-llama3', name: 'Llama 3', provider: 'Ollama' },
  { id: 'ollama-codellama', name: 'Code Llama', provider: 'Ollama' },
  { id: 'openrouter-gpt4o', name: 'GPT-4o', provider: 'OpenRouter' },
  { id: 'groq-llama', name: 'Llama 3.1', provider: 'Groq' },
  { id: 'gemini-flash', name: 'Gemini 2.0 Flash', provider: 'Gemini' },
]

export default function ChatPage() {
  const { chats, activeChat, messages, isStreaming, streamingMessageId } = useChatStore()
  const { data: fetchedChats, isLoading: chatsLoading } = useChats()
  const createChatMutation = useCreateChat()
  const deleteChatMutation = useDeleteChat()
  const { sendMessage, cancelMessage } = useSendMessage()

  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('ollama-llama3')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !activeChat) return

    const content = input
    setInput('')

    try {
      await sendMessage(content)
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error)
    }
  }

  const handleNewChat = async () => {
    try {
      const [providerId, modelId] = selectedModel.split('-')
      await createChatMutation.mutateAsync({
        title: `Yeni Sohbet ${chats.length + 1}`,
        modelId,
        providerId,
      })
    } catch (error) {
      console.error('Sohbet oluşturma hatası:', error)
    }
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChatMutation.mutateAsync(chatId)
    } catch (error) {
      console.error('Sohbet silme hatası:', error)
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <Button className="w-full" onClick={handleNewChat} disabled={createChatMutation.isPending}>
            {createChatMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Yeni Sohbet
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {chatsLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Henüz sohbet yok
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors group ${
                  activeChat?.id === chat.id ? 'bg-muted' : ''
                }`}
                onClick={() => useChatStore.getState().setActiveChat(chat)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{chat.title}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteChat(chat.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {chat.messageCount} mesaj
                </p>
                {chat.isPinned && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Sabitlenmiş
                  </Badge>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold">{activeChat?.title || 'AI Sohbet'}</h2>
            <p className="text-sm text-muted-foreground">
              {activeChat ? `${activeChat.messageCount} mesaj` : 'Yeni sohbet başlatın'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Model seçin" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      <span>{model.name}</span>
                      <span className="text-muted-foreground text-xs">({model.provider})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Merhaba!</h3>
                <p className="text-muted-foreground mt-1">
                  AI asistanınıza bir mesaj gönderin
                </p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      <Bot className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.status === 'streaming' && (
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
                  )}
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <Button type="button" variant="outline" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder={activeChat ? 'Mesajınızı yazın...' : 'Önce bir sohbet oluşturun'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming || !activeChat}
              className="flex-1"
            />
            {isStreaming ? (
              <Button type="button" variant="destructive" onClick={cancelMessage}>
                Durdur
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim() || isStreaming || !activeChat}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI yanıtları hatalı olabilir. Önemli bilgileri doğrulamanızı öneririz.
          </p>
        </div>
      </div>
    </div>
  )
}
