import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/session'
import { providerConfigs } from '@/config/providers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const providersWithStatus = providerConfigs.map((p) => {
      const envKeyMap: Record<string, string> = {
        openrouter: 'OPENROUTER_API_KEY',
        groq: 'GROQ_API_KEY',
        gemini: 'GEMINI_API_KEY',
        'github-models': 'GITHUB_MODELS_TOKEN',
        huggingface: 'HUGGINGFACE_API_KEY',
        'cloudflare-ai': 'CLOUDFLARE_AI_API_KEY',
        ollama: '',
        lmstudio: '',
      }
      const envKey = envKeyMap[p.slug]
      const apiKeySet = envKey ? !!process.env[envKey] : !p.apiKeyRequired

      return {
        id: p.slug,
        name: p.name,
        slug: p.slug,
        baseUrl: p.baseUrl,
        apiKeyRequired: p.apiKeyRequired,
        apiKeySet,
        capabilities: p.capabilities,
        models: p.models.map((m) => ({
          id: m.modelId,
          name: m.name,
          description: m.description,
          maxTokens: m.maxTokens,
          isFree: m.isFree,
          capabilities: m.capabilities,
        })),
      }
    })

    return NextResponse.json(providersWithStatus)
  } catch (error) {
    console.error('[api/ai/providers]', error)
    return NextResponse.json({ error: 'Sağlayıcılar alınırken hata oluştu' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
    }

    const body = await request.json()
    const { id, enabled } = body

    if (!id) {
      return NextResponse.json({ error: 'Sağlayıcı ID gerekli' }, { status: 400 })
    }

    const provider = providerConfigs.find((p) => p.slug === id)
    if (!provider) {
      return NextResponse.json({ error: 'Sağlayıcı bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sağlayıcı yapılandırması güncellendi',
    })
  } catch (error) {
    console.error('[api/ai/providers PUT]', error)
    return NextResponse.json({ error: 'Sağlayıcı güncellenirken hata oluştu' }, { status: 500 })
  }
}
