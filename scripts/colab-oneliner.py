# Colab tek hucre kurulumu - su kodu Colab'a yapistirin
!curl -fsSL https://ollama.com/install.sh | sh && !ollama pull llama3.2 && !pip install pyngrok -q && import subprocess, time, urllib.request, json; from pyngrok import ngrok; subprocess.Popen(['ollama', 'serve']); time.sleep(5); t = ngrok.connect(11434); print(f"\nURL: {t.public_url}\nAryaIDE .env: OLLAMA_BASE_URL={t.public_url}")
