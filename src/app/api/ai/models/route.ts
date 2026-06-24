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

    const { searchParams } = new URL(request.url)
    const providerSlug = searchParams.get('provider') ?? searchParams.get('providerId')

    const allModels = providerConfigs.flatMap((p) =>
      p.models.map((m) => ({
        id: m.modelId,
        modelId: m.modelId,
        name: m.name,
        provider: p.name,
        providerId: p.slug,
        description: m.description,
        contextLength: m.maxTokens,
        maxTokens: m.maxTokens,
        costPer1k: m.inputPrice,
        inputPrice: m.inputPrice,
        outputPrice: m.outputPrice,
        isFree: m.isFree,
        capabilities: m.capabilities,
        features: Object.entries(m.capabilities)
          .filter(([, v]) => v)
          .map(([k]) => {
            const labels: Record<string, string> = {
              chat: 'Sohbet',
              completion: 'Tamamlama',
              embeddings: 'Gömme',
              vision: 'Görüntü',
            }
            return labels[k] ?? k
          }),
      }))
    )

    const filtered = providerSlug
      ? allModels.filter((m) => m.providerId.toLowerCase() === providerSlug.toLowerCase())
      : allModels

    return NextResponse.json(filtered)
  } catch (error) {
    console.error('[api/ai/models]', error)
    return NextResponse.json({ error: 'Modeller alınırken hata oluştu' }, { status: 500 })
  }
}
