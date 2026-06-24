import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/session'

const providerConfigs: Record<string, { baseUrl: string; envKey: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', envKey: 'OPENAI_API_KEY' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', envKey: 'OPENROUTER_API_KEY' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', envKey: 'GROQ_API_KEY' },
  ollama: { baseUrl: 'http://localhost:11434/v1', envKey: '' },
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, modelId, providerId, temperature, maxTokens, tools, stream = true } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages gerekli' }, { status: 400 })
    }

    const provider = providerId || 'openai'
    const cfg = providerConfigs[provider] || providerConfigs['openai']
    const effectiveApiKey = process.env[cfg.envKey] || ''

    if (provider !== 'ollama' && !effectiveApiKey) {
      return NextResponse.json(
        { error: `${provider} için API anahtarı bulunamadı` },
        { status: 400 }
      )
    }

    const upstreamBody: Record<string, unknown> = {
      model: modelId || 'gpt-4',
      messages,
      stream,
      max_tokens: maxTokens || 4096,
      temperature: temperature || 0.7,
    }

    if (tools && tools.length > 0) {
      upstreamBody.tools = tools
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (effectiveApiKey) {
      headers['Authorization'] = `Bearer ${effectiveApiKey}`
    }

    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      headers['X-Title'] = 'Arya IDE'
    }

    const upstream = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(upstreamBody),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return NextResponse.json(
        { error: `AI API hatası: ${upstream.status}`, detail: errText },
        { status: upstream.status }
      )
    }

    if (stream) {
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
                  if (data === '[DONE]') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    continue
                  }
                  try {
                    const parsed = JSON.parse(data)
                    const token = parsed.choices?.[0]?.delta?.content
                    const toolCalls = parsed.choices?.[0]?.delta?.tool_calls
                    if (token || toolCalls) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: token || '', toolCalls: toolCalls || null })}\n\n`)
                      )
                    }
                  } catch {
                    // ignore
                  }
                }
              }
            }
          } catch (err) {
            controller.error(err)
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    const result = await upstream.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('[agent/chat]', error)
    return NextResponse.json({ error: 'Chat hatası' }, { status: 500 })
  }
}
