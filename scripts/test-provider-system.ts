import { readFileSync } from 'fs';
import { createProvider, listProviders } from '../src/ai/providers';

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

async function testProviderSystem() {
  console.log('=== PROVIDER SISTEMI TEST ===\n');

  const providers = listProviders();
  console.log(`Mevcut saglayicilar: ${providers.join(', ')}\n`);

  // Groq test
  console.log('1. Groq Test:');
  try {
    const groq = createProvider('groq', { apiKey: process.env.GROQ_API_KEY });
    const available = await groq.isAvailable();
    console.log(`   Kullanilabilir: ${available}`);

    if (available) {
      const response = await groq.chat([
        { role: 'user', content: 'TypeScript ile basit bir fonksiyon ornegi yaz. Turkce acikla.' }
      ], 'llama-3.1-8b-instant', {
        temperature: 0.7,
        maxTokens: 200
      });

      console.log(`   Yanit: ${response.content}`);
      console.log(`   Token: ${response.usage.totalTokens}`);
    }
  } catch (error: any) {
    console.log(`   Hata: ${error.message}`);
  }

  // Free Models test
  console.log('\n2. Free Models Test:');
  try {
    const freeModels = createProvider('free-models');
    const available = await freeModels.isAvailable();
    console.log(`   Kullanilabilir: ${available}`);

    if (available) {
      const response = await freeModels.chat([
        { role: 'user', content: 'Merhaba, nasılsın? Turkce cevap ver.' }
      ], undefined, {
        temperature: 0.7,
        maxTokens: 100
      });

      console.log(`   Yanit: ${response.content}`);
    }
  } catch (error: any) {
    console.log(`   Hata: ${error.message}`);
  }

  console.log('\n=== TEST TAMAMLANDI ===');
}

testProviderSystem();
