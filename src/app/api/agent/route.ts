import { NextRequest, NextResponse } from 'next/server'
import { getDefaultUserId } from '@/lib/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const userId = getDefaultUserId()

    const body = await request.json()
    const { message, projectId, context, model = 'gpt-4o', provider = 'openai', apiKey } = body

    if (!message) {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })
    }

    const systemPrompt = `Sen Arya IDE'nin yapay zeka ajanısın. Görevleriniz:
1. Dosya okuma ve yazma
2. Kod analizi ve optimizasyon
3. Hata ayıklama
4. Terminal komutları çalıştırma
5. Proje yapılandırması

Kullanıcı projeleri üzerinde çalışabilir, dosyaları düzenleyebilir ve komutları çalıştırabilirsiniz.
Tüm yanıtlarınızı Türkçe verin.
Proje bağlamı: ${context || 'Genel assistan'}`

    const providerConfig: Record<string, { baseUrl: string; envKey: string }> = {
      openai: { baseUrl: 'https://api.openai.com/v1', envKey: 'OPENAI_API_KEY' },
      openrouter: { baseUrl: 'https://openrouter.ai/api/v1', envKey: 'OPENROUTER_API_KEY' },
      groq: { baseUrl: 'https://api.groq.com/openai/v1', envKey: 'GROQ_API_KEY' },
    }

    const cfg = providerConfig[provider] ?? providerConfig['openai']
    const effectiveApiKey = apiKey || process.env[cfg.envKey] || ''

    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: `${provider} için API anahtarı bulunamadı` },
        { status: 400 }
      )
    }

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
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: true,
        max_tokens: 4096,
        temperature: 0.3,
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return NextResponse.json(
        { error: `Ajan API hatası: ${upstream.status}`, detail: errText },
        { status: upstream.status }
      )
    }

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
                    controller.enqueue(encoder.encode(token))
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
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('[agent]', error)
    return NextResponse.json({ error: 'Ajan çalıştırılırken hata oluştu' }, { status: 500 })
  }
}
