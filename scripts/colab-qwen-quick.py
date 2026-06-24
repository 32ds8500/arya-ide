# ============================================================
# Colab Qwen 2.5 Coder 7B - Hizli Test
# ============================================================
# Tek hucrede calisir

# Ollama kur ve modeli indir
!curl -fsSL https://ollama.com/install.sh | sh
!ollama pull qwen2.5-coder:7b

# Sunucuyu baslat
import subprocess, time, urllib.request, json

subprocess.Popen(['ollama', 'serve'])
time.sleep(5)

# Test 1: Kod yazma
print("="*50)
print("TEST 1: TypeScript Fibonacci")
print("="*50)

response = urllib.request.urlopen('http://localhost:11434/api/chat', data=json.dumps({
    "model": "qwen2.5-coder:7b",
    "messages": [{"role": "user", "content": "TypeScript ile Fibonacci fonksiyonu yaz.递归 ve iteratif iki versiyon olsun."}],
    "stream": False,
    "options": {"num_predict": 300}
}).encode(), headers={'Content-Type': 'application/json'})

result = json.loads(response.read())
print(result['message']['content'])

# Test 2: React component
print("\n" + "="*50)
print("TEST 2: React Component")
print("="*50)

response = urllib.request.urlopen('http://localhost:11434/api/chat', data=json.dumps({
    "model": "qwen2.5-coder:7b",
    "messages": [{"role": "user", "content": "React ile bir Button componenti yaz. TypeScript, variants ve onClick destegi olsun."}],
    "stream": False,
    "options": {"num_predict": 400}
}).encode(), headers={'Content-Type': 'application/json'})

result = json.loads(response.read())
print(result['message']['content'])

# Test 3: Hata ayiklama
print("\n" + "="*50)
print("TEST 3: Hata Ayiklama")
print("="*50)

response = urllib.request.urlopen('http://localhost:11434/api/chat', data=json.dumps({
    "model": "qwen2.5-coder:7b",
    "messages": [{"role": "user", "content": "Asagidaki koddaki hatayi bul ve duzelt:\n\nasync function getData() {\n  const res = fetch('/api/data')\n  return res.json()\n}"}],
    "stream": False,
    "options": {"num_predict": 300}
}).encode(), headers={'Content-Type': 'application/json'})

result = json.loads(response.read())
print(result['message']['content'])

# ngrok ile URL al
print("\n" + "="*50)
print("PUBLIC URL")
print("="*50)

!pip install pyngrok -q
from pyngrok import ngrok

try:
    tunnel = ngrok.connect(11434)
    print(f"\nURL: {tunnel.public_url}")
    print(f"\nAryaIDE .env'ye ekle:")
    print(f"OLLAMA_BASE_URL={tunnel.public_url}")
except:
    print("ngrok token gerekli: https://dashboard.ngrok.com/get-started/your-authtoken")

print("\nTest tamamlandi!")
