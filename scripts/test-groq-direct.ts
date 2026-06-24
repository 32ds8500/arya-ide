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

async function testGroq() {
  const apiKey = envVars['GROQ_API_KEY'];
  console.log(`API Key mevcut: ${apiKey ? 'Evet (' + apiKey.substring(0, 10) + '...)' : 'Hayir'}`);

  if (!apiKey) {
    console.log('GROQ_API_KEY bulunamadi');
    return;
  }

  try {
    console.log('\nGroq API test basliyor...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'user', content: 'Merhaba! Turkce olarak kisa bir selam ver.' }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`HTTP Hata: ${response.status}`);
      console.log(`Hata: ${error}`);
      return;
    }

    const data = await response.json();
    console.log(`\nBasarili! Yanit: ${data.choices?.[0]?.message?.content}`);
    console.log(`Model: ${data.model}`);
    console.log(`Token: ${data.usage?.total_tokens}`);

  } catch (error: any) {
    console.error('Hata:', error.message);
  }
}

testGroq();
