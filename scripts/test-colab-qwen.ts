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

async function testColabQwen() {
  const baseUrl = envVars['OLLAMA_BASE_URL'] || 'http://localhost:11434';

  console.log('=== COLAB QWEN 2.5 CODER TEST ===\n');
  console.log(`URL: ${baseUrl}\n`);

  // Model listesini kontrol et
  try {
    const tagsResponse = await fetch(`${baseUrl}/api/tags`);
    const tagsData = await tagsResponse.json();

    console.log('Mevcut modeller:');
    (tagsData.models || []).forEach((m: any) => {
      const sizeGB = (m.size / (1024 ** 3)).toFixed(1);
      console.log(`  - ${m.name} (${sizeGB} GB)`);
    });

    const qwenModel = (tagsData.models || []).find((m: any) =>
      m.name.includes('qwen') && m.name.includes('coder')
    );

    if (!qwenModel) {
      console.log('\nQwen 2.5 Coder bulunamadi!');
      console.log('Colab\'da: !ollama pull qwen2.5-coder:7b');
      return;
    }

    console.log(`\nQwen modeli: ${qwenModel.name}`);

    // Kod yazma testi
    console.log('\n--- Test 1: TypeScript Kod Yazma ---');
    const test1 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [{ role: 'user', content: 'TypeScript ile basit bir HTTP client yaz. fetch API kullan.' }],
        stream: false,
        options: { temperature: 0.7, num_predict: 300 }
      })
    });
    const result1 = await test1.json();
    console.log(result1.message?.content);

    // React testi
    console.log('\n--- Test 2: React Component ---');
    const test2 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [{ role: 'user', content: 'React ile basit bir Card componenti yaz. Props: title, description, imageUrl' }],
        stream: false,
        options: { temperature: 0.7, num_predict: 300 }
      })
    });
    const result2 = await test2.json();
    console.log(result2.message?.content);

    // Hata testi
    console.log('\n--- Test 3: Hata Ayiklama ---');
    const test3 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: [{ role: 'user', content: 'Asagidaki koddaki hatayi bul:\n\nasync function getData() {\n  const res = fetch("/api")\n  return res.json()\n}' }],
        stream: false,
        options: { temperature: 0.7, num_predict: 300 }
      })
    });
    const result3 = await test3.json();
    console.log(result3.message?.content);

    console.log('\n=== TEST BASARILI ===');

  } catch (error: any) {
    console.log(`\nHata: ${error.message}`);
    console.log('\nCozum:');
    console.log('1. Colab notebook\'unun calistigindan emin olun');
    console.log('2. ngrok URL\'inin dogru oldugunu kontrol edin');
    console.log('3. Firewall/antivirus engellemiyor mu kontrol edin');
  }
}

testColabQwen();
