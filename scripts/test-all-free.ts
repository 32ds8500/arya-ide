import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

async function testProvider(name: string, url: string, headers: Record<string, string>, body: any, parseResponse: (data: any) => string): Promise<boolean> {
  try {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`TEST: ${name}`);
    console.log('='.repeat(50));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`  HATA: ${response.status} - ${error.substring(0, 150)}`);
      return false;
    }

    const data = await response.json();
    const content = parseResponse(data);
    console.log(`  YANIT: ${content.substring(0, 300)}...`);
    console.log(`  TOKEN: ${data.usage?.total_tokens || 'N/A'}`);
    console.log(`  DURUM: BASARILI`);
    return true;
  } catch (error: any) {
    console.log(`  HATA: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('免费 AI MODELLER TEST\n');
  console.log('Tarih:', new Date().toLocaleString('tr-TR'));

  const results: { name: string; ok: boolean }[] = [];

  // 1. Groq
  const groqKey = envVars['GROQ_API_KEY'];
  if (groqKey) {
    results.push({ name: 'Groq (Llama 3.1 8B)', ok: await testProvider(
      'Groq - Llama 3.1 8B',
      'https://api.groq.com/openai/v1/chat/completions',
      { 'Authorization': `Bearer ${groqKey}` },
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'TypeScript ile basit bir HTTP client yaz. 5 satir max.' }],
        max_tokens: 200,
        temperature: 0.7
      },
      (d) => d.choices?.[0]?.message?.content || ''
    )});
  }

  // 2. Groq - Mixtral
  if (groqKey) {
    results.push({ name: 'Groq (Mixtral 8x7B)', ok: await testProvider(
      'Groq - Mixtral 8x7B',
      'https://api.groq.com/openai/v1/chat/completions',
      { 'Authorization': `Bearer ${groqKey}` },
      {
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: 'React ile basit bir Button componenti yaz. TypeScript kullan.' }],
        max_tokens: 200,
        temperature: 0.7
      },
      (d) => d.choices?.[0]?.message?.content || ''
    )});
  }

  // 3. Gemini
  const geminiKey = envVars['GEMINI_API_KEY'];
  if (geminiKey) {
    results.push({ name: 'Gemini 2.0 Flash', ok: await testProvider(
      'Gemini 2.0 Flash',
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {},
      {
        contents: [{ parts: [{ text: 'TypeScript ile basit bir array fonksiyonu yaz. 3 satir max.' }] }],
        generationConfig: { maxOutputTokens: 200 }
      },
      (d) => d.candidates?.[0]?.content?.parts?.[0]?.text || ''
    )});
  }

  // 4. Cloudflare
  const cfKey = envVars['CLOUDFLARE_AI_API_KEY'];
  if (cfKey) {
    results.push({ name: 'Cloudflare Llama 3.1', ok: await testProvider(
      'Cloudflare Workers AI',
      'https://api.cloudflare.com/client/v4/accounts/ai/run/@cf/meta/llama-3.1-8b-instruct',
      { 'Authorization': `Bearer ${cfKey}` },
      {
        messages: [{ role: 'user', content: 'Merhaba! Kisa bir TypeScript ornegi ver.' }],
        max_tokens: 200
      },
      (d) => d.result?.response || JSON.stringify(d).substring(0, 200)
    )});
  }

  // 5. GitHub Models
  const githubToken = envVars['GITHUB_MODELS_TOKEN'];
  if (githubToken) {
    results.push({ name: 'GitHub Models Llama 3.1', ok: await testProvider(
      'GitHub Models',
      'https://models.inference.ai.azure.com/chat/completions',
      { 'Authorization': `Bearer ${githubToken}` },
      {
        model: 'meta-llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: 'Turce merhaba de ve kisa bir kod ornegi ver.' }],
        max_tokens: 200
      },
      (d) => d.choices?.[0]?.message?.content || ''
    )});
  }

  // 6. Colab (eger calisiyorsa)
  const colabUrl = envVars['OPENAI_BASE_URL'];
  if (colabUrl && colabUrl !== 'http://localhost:5000/v1') {
    results.push({ name: 'Colab Ollama', ok: await testProvider(
      'Colab OpenAI Uyumlu',
      `${colabUrl}/chat/completions`,
      { 'Authorization': `Bearer ${envVars['OPENAI_API_KEY'] || 'colab-ollama'}` },
      {
        model: 'qwen2.5-coder:7b',
        messages: [{ role: 'user', content: 'TypeScript ile basit bir fonksiyon yaz.' }],
        max_tokens: 200
      },
      (d) => d.choices?.[0]?.message?.content || ''
    )});
  }

  // SONUCLAR
  console.log('\n' + '='.repeat(50));
  console.log('SONUCLAR');
  console.log('='.repeat(50));

  const successful = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  successful.forEach(r => console.log(`  BASARILI: ${r.name}`));
  failed.forEach(r => console.log(`  BASARISIZ: ${r.name}`));

  console.log(`\nToplam: ${successful.length}/${results.length} calisiyor`);

  if (failed.length > 0) {
    console.log('\nNot: Bazı servisler rate limit veya erişim hatası verebilir.');
    console.log('Colab ile tamamen ucretsiz ve sinirsiz kullanabilirsiniz.');
  }
}

runTests();
