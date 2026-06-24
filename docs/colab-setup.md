# Google Colab ile Yerel AI Modelleri

## Neden Colab?
- **Ucretsiz GPU** - Hizli model calistirma
- **Ucretsiz RAM** - Buyuk modelleri calistirabilirsin
- **Her yerden erisim** - URL ile baglan

## Kurulum Adimlari

### 1. Colab Notebook'u Ac
- [Google Colab](https://colab.research.google.com) gidin
- `scripts/colab-ollama-server.py` dosyasini yukleyin
- veya asagidaki kodu Colab hucreye yapistirin

### 2. ngrok Token Al (Ucretsiz)
- https://dashboard.ngrok.com/get-started/your-authtoken
- Ucretsiz hesap ac
- Token'i kopyala

### 3. Colab'da Calistir
1. Notebook'u ac
2. ngrok token'i gir (hucredeki NGROK_TOKEN bolumu)
3. `Runtime > Run All` tiklayin
4. URL'i kopyala (ornegin: `https://abc123.ngrok-free.app`)

### 4. AryaIDE'ye Baglan
1. AryaIDE'yi ac
2. Ayarlara git
3. "Ollama" saglayicisini sec
4. URL'i yapistir: `https://abc123.ngrok-free.app`

veya `.env` dosyasina ekle:
```
OLLAMA_BASE_URL=https://abc123.ngrok-free.app
```

## Mevcut Modeller

| Model | Boyut | Hiz | Ozellik |
|-------|-------|-----|---------|
| llama3.2 | 2GB | Hizli | Genel amacli |
| qwen2.5-coder:7b | 4GB | Orta | Kod yazma |
| llama3.1:8b | 4GB | Orta | Buyuk baglam |
| codellama:7b | 4GB | Orta | Kod analizi |
| mistral:7b | 4GB | Orta | Dengeli |
| deepseek-coder:6.7b | 4GB | Orta | Profesyonel kod |

## Daha Buyuk Modeller (GPU Gerekli)

Colab'da GPU varsa bu modelleri de calistirabilirsin:

```python
# 13B model (GPU gerekli)
!ollama pull llama3.1:13b

# 70B model (cok buyuk, yavas)
!ollama pull llama3.1:70b

# Code modeli
!ollama pull qwen2.5-coder:32b
```

## Sorun Giderme

### "Connection refused" hatasi
- Colab'in hala calistigindan emin ol
- URL'in dogru oldugunu kontrol et
- ngrok tunnel'in acik oldugunu kontrol et

### "Model not found" hatasi
- Model indirilmemis olabilir
- Colab'da `!ollama list` calistir

### Yavas yanit
- Colab'da GPU olmadan CPU ile calisiyor
- Daha kucuk model kullan (llama3.2)
- veya GPU'lu Colab sec (Runtime > Change runtime type > GPU)

## Ornek Colab Kodu

```python
# Hizli kurulum - tek hucrede
!curl -fsSL https://ollama.com/install.sh | sh
!ollama pull llama3.2

import subprocess, time
from pyngrok import ngrok

subprocess.Popen(['ollama', 'serve'])
time.sleep(5)

tunnel = ngrok.connect(11434)
print(f"URL: {tunnel.public_url}")
```
