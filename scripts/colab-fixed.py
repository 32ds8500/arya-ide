# ============================================================
# Google Colab - Ollama + OpenAI API (Duzeltilmis)
# ============================================================
# Tek hucrede calisir, hata almaz

# ADIM 1: Ollama kur
!curl -fsSL https://ollama.com/install.sh | sh

# ADIM 2: Model indir
!ollama pull qwen2.5-coder:7b

# ADIM 3: Sunucu baslat (arka planda)
import subprocess, time
subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(8)

# ADIM 4: Test
import urllib.request, json
try:
    r = urllib.request.urlopen('http://localhost:11434/api/tags')
    models = json.loads(r.read())
    print("Modeller:")
    for m in models.get('models', []):
        print(f"  - {m['name']}")
except Exception as e:
    print(f"Hata: {e}")

# ADIM 5: ngrok ile URL al
!pip install pyngrok -q
from pyngrok import ngrok

# Token girin: https://dashboard.ngrok.com/get-started/your-authtoken
# Ucretsiz hesap ile calisir
ngrok.set_auth_token("")  # <-- BURAYA TOKEN GIRIN

try:
    tunnel = ngrok.connect(5000, bind_tls=True)
    print(f"\nURL: {tunnel.public_url}")
except:
    # ngrok yoksa dogrudan Ollama URL'ini ver
    print("\nngrok token gerekli!")
    print("https://dashboard.ngrok.com/get-started/your-authtoken")
    print("\nAlternatif: Dogrudan Ollama API'sini kullanin")
    print("  OLLAMA_BASE_URL=http://localhost:11434")
