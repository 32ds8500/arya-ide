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

async function testGroq() {
  console.log('=== GROQ UCRETSIZ MODEL TEST ===\n');

  const provider = createProvider('groq', {
    apiKey: process.env.GROQ_API_KEY
  });

  const available = await provider.isAvailable();
  console.log(`Groq kullanilabilir: ${available}`);

  if (!available) {
    console.log('Groq baglanti hatasi');
    return;
  }

  const models = await provider.listModels();
  console.log(`\nMevcut modeller (${models.length}):`);
  models.forEach(m => console.log(`  - ${m.name} (${m.contextLength} context)`));

  console.log('\n--- Chat Test ---');
  const response = await provider.chat([
    { role: 'user', content: 'Merhaba! Arya IDE icin kisa bir tanitim mesaji yaz. Turkce olacak.' }
  ], 'llama-3.1-8b-instant', {
    temperature: 0.7,
    maxTokens: 150
  });

  console.log(`Yanit: ${response.content}`);
  console.log(`Model: ${response.model}`);
  console.log(`Token: ${response.usage.totalTokens}`);

  console.log('\n--- Stream Test ---');
  await provider.streamChat([
    { role: 'user', content: 'React ile basit bir component yaz. 3 satirda ozetle.' }
  ], 'llama-3.1-8b-instant', {
    temperature: 0.5,
    maxTokens: 100,
    onToken: (token) => process.stdout.write(token),
    onDone: (fullText, usage) => {
      console.log(`\n\nStream tamamlandi. Token: ${usage.totalTokens}`);
    }
  });

  console.log('\n=== TEST BASARILI ===');
}

testGroq();
