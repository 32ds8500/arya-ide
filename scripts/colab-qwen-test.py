# ============================================================
# Google Colab - Qwen 2.5 Coder 7B Test
# ============================================================
# Bu notebook'u Colab'da calistirin
# GPU onerilir (Runtime > Change runtime type > T4 GPU)

# ============================================================
# ADIM 1: Ollama Kurulumu
# ============================================================
!curl -fsSL https://ollama.com/install.sh | sh

# ============================================================
# ADIM 2: Qwen 2.5 Coder 7B Indir
# ============================================================
print("="*60)
print("Qwen 2.5 Coder 7B indiriliyor (~4.4GB)...")
print("="*60)
!ollama pull qwen2.5-coder:7b

# ============================================================
# ADIM 3: Ek Modeller (Opsiyonel)
# ============================================================
# Hafif model (hizli test icin)
!ollama pull llama3.2

print("\n" + "="*60)
print("Indirme tamamlandi!")
print("="*60)

# ============================================================
# ADIM 4: Sunucusu Baslat
# ============================================================
import subprocess
import time

server = subprocess.Popen(
    ['ollama', 'serve'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(5)
print("Ollama sunucusu baslatildi!")

# ============================================================
# ADIM 5: Mevcut Modelleri Listele
# ============================================================
import urllib.request
import json

response = urllib.request.urlopen('http://localhost:11434/api/tags')
data = json.loads(response.read())

print("\nMevcut modeller:")
for model in data.get('models', []):
    size_gb = model.get('size', 0) / (1024**3)
    print(f"  - {model['name']} ({size_gb:.1f} GB)")

# ============================================================
# ADIM 6: Qwen 2.5 Coder Testleri
# ============================================================

def test_model(model_name, prompt, max_tokens=500):
    """Modeli test et"""
    print(f"\n{'='*60}")
    print(f"Model: {model_name}")
    print(f"Prompt: {prompt[:50]}...")
    print(f"{'='*60}")

    data = json.dumps({
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": max_tokens}
    }).encode('utf-8')

    req = urllib.request.Request(
        'http://localhost:11434/api/chat',
        data=data,
        headers={'Content-Type': 'application/json'}
    )

    start_time = time.time()
    response = urllib.request.urlopen(req)
    result = json.loads(response.read())
    elapsed = time.time() - start_time

    content = result.get('message', {}).get('content', '')
    prompt_tokens = result.get('prompt_eval_count', 0)
    completion_tokens = result.get('eval_count', 0)

    print(f"\nYanit ({elapsed:.1f}s):")
    print("-" * 40)
    print(content)
    print("-" * 40)
    print(f"Token: {prompt_tokens} prompt + {completion_tokens} yanit = {prompt_tokens + completion_tokens} toplam")

    return content

# TEST 1: Basit Kod Yazma
test_model(
    "qwen2.5-coder:7b",
    "TypeScript ile bir Fibonacci fonksiyonu yaz. Asenkron olsun ve hata yonetimi eklesin."
)

# TEST 2: React Component
test_model(
    "qwen2.5-coder:7b",
    "React ile bir TodoList componenti yaz. Ekleme, silme ve tamamlama ozellikleri olsun. TypeScript kullan."
)

# TEST 3: API Endpoint
test_model(
    "qwen2.5-coder:7b",
    "Next.js icin bir API endpoint yaz. /api/users GET ve POST islemleri desteklesin. Validasyon ekle."
)

# TEST 4: Hata Ayiklama
test_model(
    "qwen2.5-coder:7b",
    "Asagidaki kodda hata var. Duzelt ve acikla:\n\n```typescript\nasync function fetchData(url: string) {\n  const response = fetch(url)\n  return response.json()\n}\n```"
)

# TEST 5: Refactoring
test_model(
    "qwen2.5-coder:7b",
    "Asagidaki kodu yeniden duzenle. Daha okunabilir ve bakim yapilabilir hale getir:\n\n```javascript\nfunction process(data) {\n  let result = []\n  for (let i = 0; i < data.length; i++) {\n    if (data[i].active === true) {\n      result.push({name: data[i].name, value: data[i].value * 2})\n    }\n  }\n  return result\n}\n```"
)

# TEST 6: Veritabani Sorgusu
test_model(
    "qwen2.5-coder:7b",
    "PostgreSQL icin bir users tablosu olustur. İsim, email, olusturma tarihi ve aktif durum alanlari olsun. Index ekle."
)

# TEST 7: Kod Aciklamasi
test_model(
    "qwen2.5-coder:7b",
    "Asagidaki kodu Turkce olarak acikla:\n\n```typescript\nconst memoize = <T extends (...args: any[]) => any>(fn: T): T => {\n  const cache = new Map();\n  return ((...args: any[]) => {\n    const key = JSON.stringify(args);\n    if (!cache.has(key)) {\n      cache.set(key, fn(...args));\n    }\n    return cache.get(key);\n  }) as T;\n};\n```"
)

# ============================================================
# ADIM 7: Streaming Test
# ============================================================
print("\n" + "="*60)
print("STREAMING TEST")
print("="*60)

import sys

data = json.dumps({
    "model": "qwen2.5-coder:7b",
    "messages": [{"role": "user", "content": "Python ile basit bir web scraper yaz. 5 satirda ozetle."}],
    "stream": True,
    "options": {"temperature": 0.5, "max_tokens": 300}
}).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:11434/api/chat',
    data=data,
    headers={'Content-Type': 'application/json'}
)

response = urllib.request.urlopen(req)
full_text = ""

for line in response:
    try:
        chunk = json.loads(line)
        if 'message' in chunk and 'content' in chunk['message']:
            token = chunk['message']['content']
            sys.stdout.write(token)
            sys.stdout.flush()
            full_text += token
    except:
        pass

print(f"\n\nToplam: {len(full_text)} karakter")

# ============================================================
# ADIM 8: Performans Testi
# ============================================================
print("\n" + "="*60)
print("PERFORMANS TESTI")
print("="*60)

test_prompts = [
    "Basit bir hello world",
    "Kisa bir fonksiyon yaz",
    "API endpoint olustur",
    "React component yaz",
    "Veritabani sorgusu yaz"
]

total_time = 0
total_tokens = 0

for i, prompt in enumerate(test_prompts):
    data = json.dumps({
        "model": "qwen2.5-coder:7b",
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"num_predict": 100}
    }).encode('utf-8')

    req = urllib.request.Request(
        'http://localhost:11434/api/chat',
        data=data,
        headers={'Content-Type': 'application/json'}
    )

    start = time.time()
    response = urllib.request.urlopen(req)
    result = json.loads(response.read())
    elapsed = time.time() - start

    tokens = result.get('eval_count', 0)
    total_time += elapsed
    total_tokens += tokens

    print(f"Test {i+1}: {elapsed:.2f}s, {tokens} token")

print(f"\nOrtalama: {total_time/len(test_prompts):.2f}s, {total_tokens//len(test_prompts)} token")
print(f"Token/saniye: {total_tokens/total_time:.1f}")

# ============================================================
# ADIM 9: ngrok ile Public URL
# ============================================================
print("\n" + "="*60)
print("PUBLIC URL OLUSTUR")
print("="*60)

!pip install pyngrok -q

from pyngrok import ngrok

# ngrok token - https://dashboard.ngrok.com/get-started/your-authtoken
NGROK_TOKEN = ""  # <-- Token girin

if NGROK_TOKEN:
    ngrok.set_auth_token(NGROK_TOKEN)

try:
    tunnel = ngrok.connect(11434, bind_tls=True)
    public_url = tunnel.public_url

    print(f"\nPublic URL: {public_url}")
    print(f"\nAryaIDE .env dosyasina ekleyin:")
    print(f"  OLLAMA_BASE_URL={public_url}")

    # Test
    test_response = urllib.request.urlopen(f"{public_url}/api/tags")
    test_data = json.loads(test_response.read())
    print(f"\nBaglanti testi basarili! Modeller:")
    for m in test_data.get('models', []):
        print(f"  - {m['name']}")

except Exception as e:
    print(f"ngrok hatasi: {e}")
    print("Token almak icin: https://dashboard.ngrok.com/get-started/your-authtoken")

# ============================================================
# SONUC
# ============================================================
print("\n" + "="*60)
print("TEST TAMAMLANDI!")
print("="*60)
print("\nQwen 2.5 Coder 7B basariyla calisiyor!")
print("\nAryaIDE'ye baglanmak icin:")
print("1. ngrok URL'ini alin")
print("2. .env dosyasina ekleyin: OLLAMA_BASE_URL=<URL>")
print("3. AryaIDE'yi yeniden baslatin")
print("="*60)
