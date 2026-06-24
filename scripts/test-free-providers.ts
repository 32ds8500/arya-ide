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

async function testProvider(name: string, url: string, headers: Record<string, string>, body: any): Promise<boolean> {
  try {
    console.log(`\n${name} test basliyor...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`  Hata: ${response.status} - ${error.substring(0, 100)}`);
      return false;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanit alinamadi';
    console.log(`  Yanit: ${content.substring(0, 150)}...`);
    console.log(`  Model: ${data.model || body.model}`);
    return true;
  } catch (error: any) {
    console.log(`  Hata: ${error.message}`);
    return false;
  }
}

async function testAll() {
  console.log('=== UCRETSIZ AI MODELLER TEST ===\n');

  const results: { name: string; status: boolean }[] = [];

  // Groq Test
  const groqKey = envVars['GROQ_API_KEY'];
  if (groqKey) {
    results.push({ name: 'Groq', status: await testProvider('Groq',
      'https://api.groq.com/openai/v1/chat/completions',
      { 'Authorization': `Bearer ${groqKey}` },
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Turkce merhaba de.' }],
        max_tokens: 50
      }
    )});
  } else {
    console.log('\nGroq: API key yok');
  }

  // Gemini Test
  const geminiKey = envVars['GEMINI_API_KEY'];
  if (geminiKey) {
    results.push({ name: 'Gemini', status: await testProvider('Gemini',
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {},
      {
        contents: [{ parts: [{ text: 'Turkce merhaba de.' }] }],
        generationConfig: { maxOutputTokens: 50 }
      }
    )});
  } else {
    console.log('\nGemini: API key yok');
  }

  // Cloudflare Test
  const cfKey = envVars['CLOUDFLARE_AI_API_KEY'];
  if (cfKey) {
    results.push({ name: 'Cloudflare', status: await testProvider('Cloudflare',
      'https://api.cloudflare.com/client/v4/accounts/ai/run/@cf/meta/llama-3.1-8b-instruct',
      { 'Authorization': `Bearer ${cfKey}` },
      { messages: [{ role: 'user', content: 'Turkce merhaba de.' }], max_tokens: 50 }
    )});
  } else {
    console.log('\nCloudflare: API key yok');
  }

  // GitHub Models Test
  const githubToken = envVars['GITHUB_MODELS_TOKEN'];
  if (githubToken) {
    results.push({ name: 'GitHub Models', status: await testProvider('GitHub Models',
      'https://models.inference.ai.azure.com/chat/completions',
      { 'Authorization': `Bearer ${githubToken}` },
      {
        model: 'meta-llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: 'Turkce merhaba de.' }],
        max_tokens: 50
      }
    )});
  } else {
    console.log('\nGitHub Models: Token yok');
  }

  console.log('\n=== SONUCLAR ===');
  results.forEach(r => console.log(`  ${r.status ? 'BASARILI' : 'BASARISIZ'}: ${r.name}`));
  console.log(`\nToplam: ${results.filter(r => r.status).length}/${results.length} calisiyor`);
}

testAll();
