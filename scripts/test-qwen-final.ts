import { createProvider } from '../src/ai/providers';

async function test() {
  const colab = createProvider('colab', {
    baseUrl: 'https://calculations-phi-gabriel-commission.trycloudflare.com'
  });

  console.log('=== QWEN 2.5 CODER 7B TEST ===\n');

  // Test 1: Kod yazma
  console.log('--- Test 1: TypeScript Kod Yazma ---');
  const r1 = await colab.chat(
    [{ role: 'user', content: 'TypeScript ile basit bir HTTP client yaz. 3 satir max.' }],
    'qwen2.5-coder:7b',
    { maxTokens: 200, temperature: 0.7 }
  );
  console.log(r1.content);
  console.log(`Token: ${r1.usage.totalTokens}\n`);

  // Test 2: React component
  console.log('--- Test 2: React Component ---');
  const r2 = await colab.chat(
    [{ role: 'user', content: 'React ile basit bir Button componenti yaz. TypeScript kullan.' }],
    'qwen2.5-coder:7b',
    { maxTokens: 300, temperature: 0.7 }
  );
  console.log(r2.content);
  console.log(`Token: ${r2.usage.totalTokens}\n`);

  // Test 3: Hata ayiklama
  console.log('--- Test 3: Hata Ayiklama ---');
  const r3 = await colab.chat(
    [{ role: 'user', content: 'Asagidaki koddaki hatayi bul:\n\nasync function getData() {\n  const res = fetch("/api")\n  return res.json()\n}' }],
    'qwen2.5-coder:7b',
    { maxTokens: 300, temperature: 0.7 }
  );
  console.log(r3.content);
  console.log(`Token: ${r3.usage.totalTokens}\n`);

  console.log('=== TEST TAMAMLANDI ===');
}

test();
