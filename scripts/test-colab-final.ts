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

const COLAB_URL = vars['OLLAMA_BASE_URL'] || vars['OPENAI_BASE_URL'] || '';

async function test() {
  console.log('=== COLAB TEST ===\n');
  console.log('URL:', COLAB_URL);

  if (!COLAB_URL || COLAB_URL.includes('localhost')) {
    console.log('\nColab URL henuz girilmemis!');
    console.log('Colab\'da scripti calistirin ve URL\'i .env\'ye ekleyin.');
    return;
  }

  // Test 1: Root
  console.log('\n--- Test 1: Baglanti ---');
  try {
    const r = await fetch(COLAB_URL, { signal: AbortSignal.timeout(5000) });
    console.log(`Status: ${r.status}`);
  } catch (e: any) {
    console.log(`Hata: ${e.message}`);
  }

  // Test 2: Ollama API
  console.log('\n--- Test 2: Ollama API ---');
  try {
    const r = await fetch(`${COLAB_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const d = await r.json();
      console.log('Modeller:', d.models?.map((m: any) => m.name).join(', '));
    } else {
      console.log(`Hata: ${r.status}`);
    }
  } catch (e: any) {
    console.log(`Hata: ${e.message}`);
  }

  // Test 3: OpenAI API
  console.log('\n--- Test 3: OpenAI API ---');
  try {
    const r = await fetch(`${COLAB_URL}/v1/models`, {
      headers: { 'Authorization': `Bearer ${vars['OPENAI_API_KEY'] || 'colab-ollama'}` },
      signal: AbortSignal.timeout(5000)
    });
    if (r.ok) {
      const d = await r.json();
      console.log('Modeller:', d.data?.map((m: any) => m.id).join(', '));
    } else {
      console.log(`Hata: ${r.status}`);
    }
  } catch (e: any) {
    console.log(`Hata: ${e.message}`);
  }

  // Test 4: Chat
  console.log('\n--- Test 4: Chat Test ---');
  try {
    const r = await fetch(`${COLAB_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [{ role: 'user', content: 'Merhaba' }],
        stream: false,
        options: { num_predict: 20 }
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (r.ok) {
      const d = await r.json();
      console.log('Yanit:', d.message?.content);
    } else {
      console.log(`Hata: ${r.status}`);
    }
  } catch (e: any) {
    console.log(`Hata: ${e.message}`);
  }

  console.log('\n=== TEST TAMAMLANDI ===');
}

test();
