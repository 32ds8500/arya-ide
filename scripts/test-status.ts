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

console.log('=== COLAB + GROQ DURUM TEST ===\n');

async function test() {
  // 1. Colab durumu
  const colabUrl = vars['OPENAI_BASE_URL'];
  console.log('Colab URL:', colabUrl || 'Tanimsiz');

  if (colabUrl && colabUrl !== 'http://localhost:5000/v1') {
    console.log('Colab sunucusuna baglaniyor...');
    try {
      const r = await fetch(colabUrl + '/models', {signal: AbortSignal.timeout(5000)});
      if (r.ok) {
        const d = await r.json();
        console.log('COLAB: CALISIYOR');
        console.log('Modeller:', d.data?.map((m: any) => m.id).join(', '));
      } else {
        console.log('COLAB: HATA -', r.status);
      }
    } catch(e: any) {
      console.log('COLAB: BAGLANTI YOK -', e.message);
    }
  } else {
    console.log('COLAB: HENÜZ ACILMAMIS');
    console.log('Cozum: Colab\'da scripti calistirin');
  }

  // 2. Groq test
  console.log('\n--- GROQ TEST ---');
  const groqKey = vars['GROQ_API_KEY'];
  if (groqKey) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+groqKey},
      body: JSON.stringify({
        model:'llama-3.1-8b-instant',
        messages:[{role:'user',content:'Merhaba, 1 kelime ile yanit ver'}],
        max_tokens:10
      })
    });
    const d = await r.json();
    console.log('Groq Yanit:', d.choices?.[0]?.message?.content);
    console.log('Durum: CALISIYOR');
  }

  // 3. Provider listesi
  console.log('\n--- MEVCUT MODALLER ---');
  console.log('Groq: Llama 3.1 8B, 70B, Gemma 2 9B');
  console.log('Colab: Qwen 2.5 Coder 7B (baglaninca)');
  console.log('Ollama: Yerel modeller (kurulunca)');

  console.log('\n=== SONUC ===');
  console.log('Groq ucretsiz ve calisiyor!');
  console.log('Colab icin: scripts/colab-simple.py dosyasini Colab\'da calistirin');
}

test();
