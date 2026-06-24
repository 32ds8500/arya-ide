# Google Colab - Ollama Server (Basit Surum)
# Colab'da calistirin, otomatik URL olusturur.

# ============================================================
# OLLAMA KURULUMU
# ============================================================
!curl -fsSL https://ollama.com/install.sh | sh

# ============================================================
# MODELLERI INDIR
# ============================================================
print("Llama 3.2 indiriliyor...")
!ollama pull llama3.2

print("Qwen 2.5 Coder indiriliyor...")
!ollama pull qwen2.5-coder:7b

print("Modeller hazir!")

# ============================================================
# SUNUCUYU BASLAT VE URL AL
# ============================================================
import subprocess
import time
import threading
import urllib.request
import json

# Ollama sunucusunu baslat
server = subprocess.Popen(
    ['ollama', 'serve'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(5)

# ngrok kur ve baglan
!pip install pyngrok -q

from pyngrok import ngrok, conf

# Ucretsiz ngrok token almak icin: https://dashboard.ngrok.com/get-started/your-authtoken
# Asagidaki token'i kendi token'inizla degistirin veya bos birakin (sinirli calisir)
NGROK_TOKEN = ""

if NGROK_TOKEN:
    ngrok.set_auth_token(NGROK_TOKEN)

try:
    tunnel = ngrok.connect(11434, bind_tls=True)
    public_url = tunnel.public_url

    print("\n" + "="*60)
    print("OLLAMA SUNUCU HAZIR!")
    print("="*60)
    print(f"\nPublic URL: {public_url}")
    print(f"\nAryaIDE .env dosyasina ekleyin:")
    print(f"  OLLAMA_BASE_URL={public_url}")
    print(f"\nveya AryaIDE ayarlarindan 'Ollama' saglayicisini secin")
    print(f"ve URL'i yapistirin.")
    print("="*60)

    # Model listesini goster
    try:
        response = urllib.request.urlopen(f"{public_url}/api/tags")
        data = json.loads(response.read())
        print(f"\nMevcut modeller:")
        for model in data.get('models', []):
            print(f"  - {model['name']}")
    except:
        pass

    print("\nColab'i kapatmadan once URL'i kopyalayin!")
    print("Sunucu arka planda calismaya devam edecek.")

except Exception as e:
    print(f"ngrok hatasi: {e}")
    print("ngrok token'i gerekli: https://dashboard.ngrok.com/get-started/your-authtoken")

# Sunucuyu canli tut
while True:
    time.sleep(60)
