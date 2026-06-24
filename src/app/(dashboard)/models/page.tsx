'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
import { Switch } from '@/components/ui/Switch'
import { Settings, CheckCircle2, AlertCircle, Zap, Brain } from 'lucide-react'

const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000, costPer1k: 0.005 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000, costPer1k: 0.00015 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextLength: 16385, costPer1k: 0.0005 },
    ],
    configured: true,
    apiKey: 'sk-••••••••••••••••',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', contextLength: 200000, costPer1k: 0.015 },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', contextLength: 200000, costPer1k: 0.003 },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', contextLength: 200000, costPer1k: 0.00025 },
    ],
    configured: false,
    apiKey: '',
  },
  {
    id: 'google',
    name: 'Google',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', contextLength: 32760, costPer1k: 0.00025 },
      { id: 'gemini-ultra', name: 'Gemini Ultra', contextLength: 32760, costPer1k: 0.007 },
    ],
    configured: false,
    apiKey: '',
  },
]

export default function ModelsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [defaultModel, setDefaultModel] = useState('gpt-4o')
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    google: '',
  })

  const handleTestModel = (providerId: string, modelId: string) => {
    // Test model connection
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">AI Modelleri</h1>
          <p className="text-muted-foreground mt-1">
            Yapay zeka model sağlayıcılarını ve tercihlerinizi yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label>Varsayılan Model:</Label>
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="px-3 py-2 rounded-md border bg-background"
          >
            {providers.map((provider) =>
              provider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({provider.name})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id} className={provider.configured ? 'border-green-500/50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-500" />
                  {provider.name}
                </CardTitle>
                {provider.configured ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Yapılandırıldı
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Yapılandırılmadı
                  </Badge>
                )}
              </div>
              <CardDescription>{provider.models.length} model mevcut</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Anahtarı</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="API anahtarınızı girin"
                    value={providerKeys[provider.id]}
                    onChange={(e) =>
                      setProviderKeys({ ...providerKeys, [provider.id]: e.target.value })
                    }
                  />
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modeller</Label>
                <div className="space-y-2">
                  {provider.models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{model.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {model.contextLength.toLocaleString()} token • ${model.costPer1k}/1K token
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={defaultModel === model.id}
                          onCheckedChange={() => setDefaultModel(model.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleTestModel(provider.id, provider.models[0].id)}
              >
                <Zap className="mr-2 h-4 w-4" />
                Bağlantıyı Test Et
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
