# ============================================================
# COLAB OLLAMA - EN BASIT SURUM
# ============================================================
# Sadece Ollama + ngrok. Flask gerekmez.

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
print("Modeller:", [m['name'] for m in json.loads(r.read()).get('models', [])])

# ngrok
!pip install pyngrok -q
from pyngrok import ngrok

# TOKEN BURAYA - https://dashboard.ngrok.com/get-started/your-authtoken
ngrok.set_auth_token("3DhpIfH1joAcgFBRDEZa48ffxKK_3MqV55CzTxnzziicvFecT")

t = ngrok.connect(11434)
print(f"\nURL: {t.public_url}")
print(f"\n.ENV'ye ekle: OLLAMA_BASE_URL={t.public_url}")
