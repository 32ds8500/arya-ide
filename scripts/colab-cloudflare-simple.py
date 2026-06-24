# ============================================================
# COLAB + CLOUDFLARE TUNNEL - BASIT
# ============================================================

# Ollama kur
!curl -fsSL https://ollama.com/install.sh | sh
!ollama pull qwen2.5-coder:7b

# Sunucu baslat
import subprocess, time
subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(8)

# cloudflared kur
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared
!chmod +x /usr/local/bin/cloudflared

# Tunnel baslat
!cloudflared tunnel --url http://localhost:11434 2>&1 | grep -m 1 "https://.*trycloudflare.com"
