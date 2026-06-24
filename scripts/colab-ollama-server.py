# Google Colab - Ollama Server
# Bu notebook'u Colab'da calistirin, sonra ngrok URL'ini AryaIDE'ye girin.

# ============================================================
# ADIM 1: Ollama Kurulumu
# ============================================================
!curl -fsSL https://ollama.com/install.sh | sh

# ============================================================
# ADIM 2: Model Indirme
# ============================================================
# Hafif model (hizli, 2GB RAM)
!ollama pull llama3.2

# Opsiyonel: Kod yazma modeli
# !ollama pull qwen2.5-coder:7b

# Opsiyonel: Buyuk model (yavas, yuksek kalite)
# !ollama pull llama3.1:8b

# ============================================================
# ADIM 3: Ollama Sunucusu Baslatma
# ============================================================
import subprocess
import time

# Ollama sunucusunu arka planda baslat
server = subprocess.Popen(
    ['ollama', 'serve'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(5)
print("Ollama sunucusu baslatildi!")

# ============================================================
# ADIM 4: ngrok ile URL Alma
# ============================================================
!pip install pyngrok -q

from pyngrok import ngrok
import os

# ngrok authtoken - https://dashboard.ngrok.com/get-started/your-authtoken
# Ucretsiz hesap ile calisir
NGROK_AUTH_TOKEN = "BURAYA_NGROK_TOKEN_YAZIN"  # <-- Bunu degistirin
ngrok.set_auth_token(NGROK_AUTH_TOKEN)

# 11434 portunu ac
public_url = ngrok.connect(11434)
print(f"\n{'='*60}")
print(f"PUBLIC URL: {public_url}")
print(f"{'='*60}")
print(f"\nAryaIDE'ye baglanmak icin bu URL'i kullanin:")
print(f"  OLLAMA_BASE_URL={public_url}")
print(f"\nveya .env dosyasina ekleyin:")
print(f"  OLLAMA_BASE_URL={public_url}")
print(f"{'='*60}")

# ============================================================
# ADIM 5: Test
# ============================================================
import urllib.request
import json

try:
    response = urllib.request.urlopen(f"{public_url}/api/tags")
    data = json.loads(response.read())
    print(f"\nMevcut modeller:")
    for model in data.get('models', []):
        print(f"  - {model['name']}")
except Exception as e:
    print(f"Test hatasi: {e}")

print("\nSunucu calisiyor. Colab'i kapatmadan once URL'i kopyalayin!")
