'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Search, File, Code, Brain, Filter, ArrowRight } from 'lucide-react'

const mockResults = [
  {
    id: '1',
    type: 'file',
    name: 'Button.tsx',
    path: 'src/components/Button.tsx',
    preview: 'export function Button({ children, variant, ...props }) {',
    matchCount: 3,
  },
  {
    id: '2',
    type: 'code',
    name: 'handleSubmit',
    path: 'src/pages/Login.tsx',
    preview: 'const handleSubmit = async (data: LoginInput) => {',
    matchCount: 1,
  },
  {
    id: '3',
    type: 'file',
    name: 'api.ts',
    path: 'src/lib/api.ts',
    preview: 'import axios from "axios";',
    matchCount: 5,
  },
]

const semanticResults = [
  {
    id: '1',
    name: 'Kullanıcı kimlik doğrulama mantığı',
    path: 'src/auth/auth.service.ts',
    score: 0.95,
    preview: 'Kullanıcı giriş yaparken JWT token oluşturur ve doğrulama yapar...',
  },
  {
    id: '2',
    name: 'API hata yakalama',
    path: 'src/middleware/error.middleware.ts',
    score: 0.88,
    preview: 'Tüm API hatalarını yakalar ve uygun formatta döndürür...',
  },
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('files')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState(mockResults)

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    // Simulate search
    setTimeout(() => {
      setIsSearching(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Arama</h1>
        <p className="text-muted-foreground mt-1">
          Dosyalarınızda, kodunuzda ve projenizde arama yapın
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Arama yapın..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 text-lg h-12"
        />
      </div>

      <Tabs defaultValue="files">
        <TabsList>
          <TabsTrigger value="files" className="gap-2">
            <File className="h-4 w-4" />
            Dosya Arama
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2">
            <Code className="h-4 w-4" />
            Kod Arama
          </TabsTrigger>
          <TabsTrigger value="semantic" className="gap-2">
            <Brain className="h-4 w-4" />
            Anlamsal Arama
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
            <Badge variant="secondary">{results.length} sonuç</Badge>
          </div>
          <div className="space-y-2">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-violet-500" />
                        <span className="font-medium">{result.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.matchCount} eşleşme
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {result.path}
                      </p>
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded font-mono">
                        {result.preview}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrele
            </Button>
            <Badge variant="secondary">{results.length} sonuç</Badge>
          </div>
          <div className="space-y-2">
            {results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{result.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {result.path}
                      </p>
                      <pre className="text-sm bg-zinc-950 text-green-400 p-2 rounded font-mono overflow-x-auto">
                        {result.preview}
                      </pre>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="semantic" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Anlamsal arama ile kodunuzun amacına göre arama yapın
          </p>
          <div className="space-y-2">
            {semanticResults.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span className="font-medium">{result.name}</span>
                        <Badge variant="secondary">
                          %{Math.round(result.score * 100)} eşleşme
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {result.path}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {result.preview}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
