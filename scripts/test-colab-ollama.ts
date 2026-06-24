import { readFileSync } from 'fs';
import { createProvider } from '../src/ai/providers';

const envContent = readFileSync('.env', 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
});

async function testColabOllama() {
  const baseUrl = process.env.OLLAMA_BASE_URL;

  console.log('=== COLAB OLLAMA TEST ===\n');
  console.log(`OLLAMA_BASE_URL: ${baseUrl}`);

  if (!baseUrl || baseUrl === 'http://localhost:11434') {
    console.log('\nColab URL henuz girilmemis.');
    console.log('Colab notebook\'unu calistirin ve URL\'i .env dosyasina ekleyin:');
    console.log('  OLLAMA_BASE_URL=https://your-id.ngrok-free.app');
    return;
  }

  try {
    console.log('\nColab sunucusuna baglaniyor...');
    const response = await fetch(`${baseUrl}/api/tags`);

    if (!response.ok) {
      console.log(`Baglanti hatasi: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log('\nBaglanti basarili!');
    console.log('\nMevcut modeller:');
    (data.models || []).forEach((m: any) => {
      console.log(`  - ${m.name}`);
    });

    // Chat testi
    if (data.models && data.models.length > 0) {
      const modelName = data.models[0].name;
      console.log(`\n${modelName} ile test...`);

      const chatResponse = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: 'Merhaba! Turkce kisa bir yanit ver.' }],
          stream: false
        })
      });

      const chatData = await chatResponse.json();
      console.log(`Yanit: ${chatData.message?.content}`);
    }

  } catch (error: any) {
    console.log(`Hata: ${error.message}`);
    console.log('\nCozum onerileri:');
    console.log('1. Colab notebook\'unun hala calistigindan emin olun');
    console.log('2. URL\'in dogru oldugunu kontrol edin');
    console.log('3. ngrok tunnel\'in acik oldugunu kontrol edin');
  }
}

testColabOllama();
