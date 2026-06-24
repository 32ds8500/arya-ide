'use client'

import { useState, useRef, useEffect } from 'react'
import { useAgent } from '@/hooks/use-agent'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Send, Bot, User, Code, File, Terminal, CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import type { ToolCall, ToolResult } from '@/types'

interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
}

const models = [
  { id: 'ollama-llama3', name: 'Llama 3', provider: 'Ollama' },
  { id: 'ollama-codellama', name: 'Code Llama', provider: 'Ollama' },
  { id: 'openrouter-gpt4o', name: 'GPT-4o', provider: 'OpenRouter' },
  { id: 'groq-llama', name: 'Llama 3.1', provider: 'Groq' },
  { id: 'gemini-flash', name: 'Gemini 2.0 Flash', provider: 'Gemini' },
]

const tools = [
  { name: 'Dosya Oku', description: 'Dosya içeriğini okur', icon: File },
  { name: 'Dosya Yaz', description: 'Dosya oluşturur veya düzenler', icon: File },
  { name: 'Kod Analizi', description: 'Kodu analiz eder ve öneriler sunar', icon: Code },
  { name: 'Terminal', description: 'Komut çalıştırır', icon: Terminal },
]

export default function AgentPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: '1',
      role: 'agent',
      content: 'Merhaba! Ben Arya AI Ajanı. Projeniz üzerinde çalışabilirim, dosyaları düzenleyebilirim ve komutları çalıştırabilirim. Size nasıl yardımcı olabilirim?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState('ollama-llama3')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { sendMessage, abort } = useAgent({
    onToolCall: (toolCall) => {
      console.log('Tool call:', toolCall)
    },
    onToolResult: (result) => {
      console.log('Tool result:', result)
    },
    onStream: (chunk) => {
      console.log('Stream chunk:', chunk)
    },
  })

  const [isExecuting, setIsExecuting] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isExecuting) return

    const userMessage: AgentMessage = {
      id: String(Date.now()),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsExecuting(true)

    try {
      const response = await sendMessage(input)

      const agentMessage: AgentMessage = {
        id: String(Date.now()),
        role: 'agent',
        content: response.content,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
        toolResults: response.toolResults,
      }

      setMessages((prev) => [...prev, agentMessage])
    } catch (error) {
      console.error('Agent error:', error)
      const errorMessage: AgentMessage = {
        id: String(Date.now()),
        role: 'agent',
        content: `Hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold">AI Ajanı</h2>
            <p className="text-sm text-muted-foreground">
              Projeniz üzerinde çalışan yapay zeka ajanı
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
            <Badge variant="outline" className="gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Çevrimiçi
            </Badge>
          </div>
        </div>

        <div className="flex-1 flex">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'agent' && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500">
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`space-y-2 ${message.role === 'user' ? 'max-w-[80%]' : 'max-w-[90%]'}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="space-y-2">
                        {message.toolCalls.map((tool, idx) => (
                          <Card key={tool.id || idx} className="text-sm">
                            <CardHeader className="p-3 pb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="font-medium">{tool.function.name}</span>
                                <Badge variant="default">Tamamlandı</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <div className="font-mono text-xs bg-zinc-950 text-green-400 p-2 rounded">
                                <div className="text-zinc-500">Parametreler:</div>
                                <div>{tool.function.arguments}</div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
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
              {isExecuting && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500">
                      <Bot className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      <span className="text-sm">Düşünüyor...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="w-80 border-l hidden lg:block">
            <div className="p-4 border-b">
              <h3 className="font-medium text-sm">Ajan Bilgileri</h3>
            </div>
            <ScrollArea className="p-4 space-y-4">
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Kullanılabilir Araçlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {tools.map((tool) => (
                    <div key={tool.name} className="flex items-center gap-2 text-sm">
                      <tool.icon className="h-3 w-3 text-violet-500" />
                      <div>
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-xs text-muted-foreground">{tool.description}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    İstatistikler
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Toplam Mesaj</span>
                    <span>{messages.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Araç Kullanımı</span>
                    <span>{messages.reduce((acc, m) => acc + (m.toolCalls?.length || 0), 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </ScrollArea>
          </div>
        </div>

        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2 max-w-4xl mx-auto"
          >
            <Input
              placeholder="Talimatınızı yazın..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isExecuting}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isExecuting}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Ajan dosyalarınızı düzenleyebilir ve komut çalıştırabilir. Lütfen dikkatli olun.
          </p>
        </div>
      </div>
    </div>
  )
}
