import { NextRequest } from 'next/server'
import { getDefaultUserId } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import { messages as messagesTable } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const body = await request.json()
    const { chatId, content, model = 'gpt-4o', provider = 'openai', apiKey } = body

    if (!content) {
      return new Response('Mesaj içeriği gerekli', { status: 400 })
    }

    // Save user message (only if chatId provided)
    if (chatId) {
      try {
        await db.insert(messagesTable).values({
          chatId,
          content,
          role: 'user',
        })
      } catch {
        // Non-fatal: continue even if DB insert fails
      }
    }

    // Get chat history for context
    let historyMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
    if (chatId) {
      try {
        const chatHistory = await db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.chatId, chatId))
          .limit(20)

        historyMessages = chatHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }))
      } catch {
        // Non-fatal: proceed without history
      }
    }

    const allMessages = [
      {
        role: 'system' as const,
        content:
          "Sen Arya IDE'nin yapay zeka asistanısın. Kullanıcılara kod geliştirme, hata ayıklama ve proje yönetimi konularında yardımcı oluyorsun. Yanıtlarını Türkçe ver.",
      },
      ...historyMessages,
      { role: 'user' as const, content },
    ]

    // Determine base URL and effective API key based on provider
    const providerConfig: Record<string, { baseUrl: string; envKey: string }> = {
      openai: { baseUrl: 'https://api.openai.com/v1', envKey: 'OPENAI_API_KEY' },
      openrouter: { baseUrl: 'https://openrouter.ai/api/v1', envKey: 'OPENROUTER_API_KEY' },
      groq: { baseUrl: 'https://api.groq.com/openai/v1', envKey: 'GROQ_API_KEY' },
      'github-models': { baseUrl: 'https://models.inference.ai.azure.com', envKey: 'GITHUB_TOKEN' },
    }

    const cfg = providerConfig[provider] ?? providerConfig['openai']
    const effectiveApiKey = apiKey || process.env[cfg.envKey] || ''

    if (!effectiveApiKey) {
      return new Response(
        JSON.stringify({ error: `${provider} için API anahtarı bulunamadı` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Stream using fetch + ReadableStream (works with any OpenAI-compatible provider)
    const upstream = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveApiKey}`,
        ...(provider === 'openrouter'
          ? {
              'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
              'X-Title': 'Arya IDE',
            }
          : {}),
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return new Response(
        JSON.stringify({ error: `AI sağlayıcı hatası: ${upstream.status}`, detail: errText }),
        { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Pipe stream and collect full text to save
    let fullText = ''
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const readable = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter((l) => l.trim())
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  const token = parsed.choices?.[0]?.delta?.content
                  if (token) {
                    fullText += token
                    controller.enqueue(encoder.encode(token))
                  }
                } catch {
                  // Ignore malformed SSE lines
                }
              }
            }
          }
        } catch (err) {
          controller.error(err)
        } finally {
          controller.close()
          // Save assistant response
          if (chatId && fullText) {
            db.insert(messagesTable)
              .values({ chatId, content: fullText, role: 'assistant' })
              .catch(() => {})
          }
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('[chat/stream]', error)
    return new Response('Akış oluşturulurken hata oluştu', { status: 500 })
  }
}
