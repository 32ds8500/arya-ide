# ============================================================
# COLAB OLLAMA - NGROK GEREKTIRMEZ
# ============================================================
# Colab'da Ollama calistir, URL'i otomatik olustur

# Ollama kur
!curl -fsSL https://ollama.com/install.sh | sh

# Model indir
!ollama pull qwen2.5-coder:7b

# Sunucuyu baslat
import subprocess, time
subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(8)

# Test
import urllib.request, json
r = urllib.request.urlopen('http://localhost:11434/api/tags')
models = [m['name'] for m in json.loads(r.read()).get('models', [])]
print(f"Modeller: {models}")

# Chat testi
data = json.dumps({
    "model": "qwen2.5-coder:7b",
    "messages": [{"role": "user", "content": "Merhaba! Turkce kisa yanit ver."}],
    "stream": False
}).encode()

req = urllib.request.Request('http://localhost:11434/api/chat', data=data, headers={'Content-Type': 'application/json'})
result = json.loads(urllib.request.urlopen(req).read())
print(f"\nYanit: {result['message']['content']}")

# Colab URL
print("\n" + "="*50)
print("COLAB OLLAMA HAZIR!")
print("="*50)
print("\nDogrudan Colab'dan kullanabilirsiniz:")
print("  API: http://localhost:11434")
print("\nveya Colab'in kendi URL'ini kullanin:")
print("  Runtime > Change runtime type > Runtime is connected")
print("  Oradaki URL'i kopyalayin")
print("="*50)
