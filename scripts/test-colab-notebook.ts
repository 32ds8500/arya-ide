import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf-8');
const vars: Record<string, string> = {};
env.split('\n').forEach(l => {
  const t = l.trim();
  if (t && !t.startsWith('#')) {
    const [k, ...v] = t.split('=');
    if (k) vars[k.trim()] = v.join('=').trim();
  }
});

const COLAB_URL = vars['OLLAMA_BASE_URL'] || '';

async function test() {
  console.log('=== COLAB OLLAMA TEST ===\n');
  console.log('URL:', COLAB_URL);

  if (!COLAB_URL || COLAB_URL.includes('localhost')) {
    console.log('Colab URL girilmemis!');
    return;
  }

  // Test 1: Ollama API
  console.log('\n--- Test 1: Ollama API (/api/tags) ---');
  try {
    const r = await fetch(`${COLAB_URL}/api/tags`, { signal: AbortSignal.timeout(10000) });
    if (r.ok) {
      const d = await r.json();
      console.log('BASARILI! Modeller:');
      d.models?.forEach((m: any) => console.log(`  - ${m.name}`));
    } else {
      console.log(`HATA: ${r.status}`);
    }
  } catch (e: any) {
    console.log(`HATA: ${e.message}`);
  }

  // Test 2: Chat
  console.log('\n--- Test 2: Chat Test ---');
  try {
    const r = await fetch(`${COLAB_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [{ role: 'user', content: 'Merhaba, 1 kelime ile yanit ver' }],
        stream: false,
        options: { num_predict: 10 }
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (r.ok) {
      const d = await r.json();
      console.log('Yanit:', d.message?.content);
      console.log('Token:', d.eval_count);
    } else {
      console.log(`HATA: ${r.status}`);
    }
  } catch (e: any) {
    console.log(`HATA: ${e.message}`);
  }

  // Test 3: Provider sistemi
  console.log('\n--- Test 3: Provider Sistemi ---');
  const { createProvider } = await import('../src/ai/providers');
  const colab = createProvider('colab');
  const available = await colab.isAvailable();
  console.log('Colab Provider kullanilabilir:', available);

  if (available) {
    const response = await colab.chat([
      { role: 'user', content: 'TypeScript ile basit bir fonksiyon yaz. 2 satir.' }
    ], 'qwen2.5-coder:7b', { temperature: 0.7, maxTokens: 100 });

    console.log('Yanit:', response.content);
    console.log('Token:', response.usage.totalTokens);
  }

  console.log('\n=== TEST TAMAMLANDI ===');
}

test();
