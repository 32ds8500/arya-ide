# ============================================================
# Google Colab - Ollama + Cloudflare Tunnel
# ============================================================
# ngrok gerektirmez, ucretsiz ve sinirsiz

# ADIM 1: Ollama kur
!curl -fsSL https://ollama.com/install.sh | sh

# ADIM 2: Model indir
print("Qwen 2.5 Coder 7B indiriliyor...")
!ollama pull qwen2.5-coder:7b

print("Llama 3.2 indiriliyor...")
!ollama pull llama3.2

# ADIM 3: Sunucuyu baslat
import subprocess, time
subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(8)

# ADIM 4: Test
import urllib.request, json
r = urllib.request.urlopen('http://localhost:11434/api/tags')
models = [m['name'] for m in json.loads(r.read()).get('models', [])]
print(f"Modeller: {models}")

# ADIM 5: cloudflared kur
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared
!chmod +x /usr/local/bin/cloudflared
print("cloudflared kuruldu!")

# ADIM 6: Cloudflare Tunnel baslat
import subprocess, time, re

# cloudflared'i arka planda baslat
process = subprocess.Popen(
    ['cloudflared', 'tunnel', '--url', 'http://localhost:11434'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# URL'i bekle
print("Cloudflare Tunnel baslatiliyor...")
time.sleep(10)

# URL'i oku
url_found = False
for i in range(30):  # 30 saniye bekle
    line = process.stderr.readline()
    if not line:
        time.sleep(1)
        continue

    # URL deseni ara
    match = re.search(r'https://[a-z0-9-]+\.trycloudflare\.com', line)
    if match:
        public_url = match.group(0)
        print(f"\n{'='*60}")
        print(f"CLOUDFLARE TUNNEL HAZIR!")
        print(f"{'='*60}")
        print(f"\nPublic URL: {public_url}")
        print(f"\nAryaIDE .env dosyasina ekleyin:")
        print(f"  OLLAMA_BASE_URL={public_url}")
        print(f"\nveya OpenAI provider icin:")
        print(f"  OPENAI_BASE_URL={public_url}")
        print(f"  OPENAI_API_KEY=colab-ollama")
        print(f"{'='*60}")
        url_found = True
        break

if not url_found:
    print("URL alinamadi. Manuel kontrol:")
    print("  cloudflared tunnel --url http://localhost:11434")

# ADIM 7: Model testi
print("\n" + "="*60)
print("CHAT TESTI")
print("="*60)

test_data = json.dumps({
    "model": "qwen2.5-coder:7b",
    "messages": [{"role": "user", "content": "Merhaba! Turkce kisa yanit ver."}],
    "stream": False,
    "options": {"num_predict": 50}
}).encode()

req = urllib.request.Request(
    'http://localhost:11434/api/chat',
    data=test_data,
    headers={'Content-Type': 'application/json'}
)

result = json.loads(urllib.request.urlopen(req).read())
print(f"Yanit: {result['message']['content']}")

print("\n" + "="*60)
print("SUNUCU CALISIYOR!")
print("="*60)
print("\nColab'i kapatmayin, sunucu arka planda calismaya devam edecek.")
print("Cloudflare Tunnel otomatik olarak URL uretecek.")
print("="*60)
