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

async function testOpenAIServer() {
  console.log('=== COLAB OPENAI UYUMLU SUNUCU TEST ===\n');

  const baseUrl = envVars['OPENAI_BASE_URL'] || envVars['OLLAMA_BASE_URL'] || 'http://localhost:5000/v1';
  const apiKey = envVars['OPENAI_API_KEY'] || 'colab-ollama';

  console.log(`URL: ${baseUrl}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);

  // 1. Model listesi
  console.log('--- 1. Model Listesi ---');
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json();
    console.log('Modeller:');
    (data.data || []).forEach((m: any) => console.log(`  - ${m.id}`));
  } catch (error: any) {
    console.log(`Hata: ${error.message}`);
    console.log('Colab sunucusu calisiyor mu?');
    return;
  }

  // 2. Chat testi
  console.log('\n--- 2. Chat Completions Test ---');
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [
          { role: 'system', content: 'Sen bir yazilim gelistirme asistanisin. Turkce yanit ver.' },
          { role: 'user', content: 'TypeScript ile basit bir HTTP client yaz.' }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    console.log(`Yanit:\n${data.choices?.[0]?.message?.content}`);
    console.log(`\nToken: ${data.usage?.total_tokens}`);
  } catch (error: any) {
    console.log(`Hata: ${error.message}`);
  }

  // 3. Stream testi
  console.log('\n--- 3. Stream Test ---');
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [{ role: 'user', content: 'React ile basit bir component yaz. 3 satir.' }],
        temperature: 0.5,
        max_tokens: 200,
        stream: true
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              process.stdout.write(token);
              fullText += token;
            }
          } catch {}
        }
      }
    }

    console.log(`\n\nToplam: ${fullText.length} karakter`);
  } catch (error: any) {
    console.log(`Hata: ${error.message}`);
  }

  // 4. Hata ayiklama testi
  console.log('\n--- 4. Kod Analizi Test ---');
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [{
          role: 'user',
          content: `Asagidaki koddaki hatayi bul ve duzelt:

async function getData() {
  const res = fetch('/api/data')
  return res.json()
}

Aciklama ekle.`
        }],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const data = await response.json();
    console.log(data.choices?.[0]?.message?.content);
  } catch (error: any) {
    console.log(`Hata: ${error.message}`);
  }

  console.log('\n=== TEST TAMAMLANDI ===');
}

testOpenAIServer();
