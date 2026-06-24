import { createProvider } from '../src/ai/providers';

const COLAB_URL = 'https://calculations-phi-gabriel-commission.trycloudflare.com';

async function test() {
  console.log('=== COLAB PROVIDER TEST ===\n');
  console.log('URL:', COLAB_URL);

  const colab = createProvider('colab', { baseUrl: COLAB_URL });
  const avail = await colab.isAvailable();
  console.log('Kullanilabilir:', avail);

  if (!avail) {
    console.log('Colab baglantisi yok!');
    return;
  }

  console.log('\nModeller:');
  const models = await colab.listModels();
  models.forEach(m => console.log(`  - ${m.id}`));

  console.log('\nChat test (llama3.2, 60s timeout)...');
  try {
    const r = await colab.chat(
      [{ role: 'user', content: 'Merhaba' }],
      'llama3.2:latest',
      { maxTokens: 20, temperature: 0.7 }
    );
    console.log('Yanit:', r.content);
    console.log('Token:', r.usage.totalTokens);
  } catch (e: any) {
    console.log('Hata:', e.message);
  }

  console.log('\n=== TEST TAMAMLANDI ===');
}

test();
