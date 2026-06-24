# ============================================================
# Google Colab - Ollama + OpenAI Uyumlu API
# ============================================================
# Ngrok gerektirmez, OpenAI formatinda API sunar
# AryaIDE OpenAI provider ile baglanabilir

# ============================================================
# ADIM 1: Gerekli Kutuphaneler
# ============================================================
!pip install flask pyngrok -q

# ============================================================
# ADIM 2: Ollama Kurulumu
# ============================================================
!curl -fsSL https://ollama.com/install.sh | sh

# ============================================================
# ADIM 3: Model Indirme
# ============================================================
print("Qwen 2.5 Coder 7B indiriliyor...")
!ollama pull qwen2.5-coder:7b

print("Llama 3.2 indiriliyor...")
!ollama pull llama3.2

print("Modeller hazir!")

# ============================================================
# ADIM 4: Ollama Sunucusu Baslat
# ============================================================
import subprocess
import time

server = subprocess.Popen(
    ['ollama', 'serve'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(5)
print("Ollama baslatildi!")

# ============================================================
# ADIM 5: OpenAI Uyumlu API Sunucusu
# ============================================================
from flask import Flask, request, jsonify
import urllib.request
import json
import threading

app = Flask(__name__)

OLLAMA_BASE = "http://localhost:11434"

@app.route('/v1/models', methods=['GET'])
def list_models():
    """OpenAI formatinda model listesi"""
    try:
        response = urllib.request.urlopen(f'{OLLAMA_BASE}/api/tags')
        data = json.loads(response.read())

        models = []
        for m in data.get('models', []):
            models.append({
                "id": m['name'],
                "object": "model",
                "created": int(time.time()),
                "owned_by": "ollama",
                "permission": [],
                "root": m['name'],
                "parent": None
            })

        return jsonify({"object": "list", "data": models})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """OpenAI formatinda chat completions"""
    try:
        data = request.json
        model = data.get('model', 'llama3.2')
        messages = data.get('messages', [])
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1024)
        stream = data.get('stream', False)

        # Ollama formatina cevir
        ollama_messages = []
        for msg in messages:
            ollama_messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })

        ollama_request = {
            "model": model,
            "messages": ollama_messages,
            "stream": stream,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        if stream:
            return stream_response(ollama_request)
        else:
            return non_stream_response(ollama_request)

    except Exception as e:
        return jsonify({"error": {"message": str(e), "type": "server_error"}}), 500

def non_stream_response(ollama_request):
    """Non-stream yanit"""
    data = json.dumps(ollama_request).encode('utf-8')
    req = urllib.request.Request(
        f'{OLLAMA_BASE}/api/chat',
        data=data,
        headers={'Content-Type': 'application/json'}
    )

    response = urllib.request.urlopen(req)
    result = json.loads(response.read())

    return jsonify({
        "id": f"chatcmpl-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": ollama_request['model'],
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": result.get('message', {}).get('content', '')
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": result.get('prompt_eval_count', 0),
            "completion_tokens": result.get('eval_count', 0),
            "total_tokens": result.get('prompt_eval_count', 0) + result.get('eval_count', 0)
        }
    })

def stream_response(ollama_request):
    """Stream yanit"""
    from flask import Response
    import queue

    def generate():
        data = json.dumps(ollama_request).encode('utf-8')
        req = urllib.request.Request(
            f'{OLLAMA_BASE}/api/chat',
            data=data,
            headers={'Content-Type': 'application/json'}
        )

        response = urllib.request.urlopen(req)
        chunk_id = f"chatcmpl-{int(time.time())}"

        for line in response:
            try:
                chunk = json.loads(line)
                if 'message' in chunk and 'content' in chunk['message']:
                    token = chunk['message']['content']
                    yield f"data: {json.dumps({'id': chunk_id, 'object': 'chat.completion.chunk', 'created': int(time.time()), 'model': ollama_request['model'], 'choices': [{'index': 0, 'delta': {'content': token}, 'finish_reason': None}]})}\n\n"
                if chunk.get('done'):
                    yield f"data: {json.dumps({'id': chunk_id, 'object': 'chat.completion.chunk', 'created': int(time.time()), 'model': ollama_request['model'], 'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'stop'}]})}\n\n"
                    yield "data: [DONE]\n\n"
            except:
                pass

    return Response(generate(), mimetype='text/plain')

@app.route('/v1/completions', methods=['POST'])
def completions():
    """OpenAI formatinda text completions"""
    try:
        data = request.json
        model = data.get('model', 'llama3.2')
        prompt = data.get('prompt', '')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 1024)

        ollama_request = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        data = json.dumps(ollama_request).encode('utf-8')
        req = urllib.request.Request(
            f'{OLLAMA_BASE}/api/chat',
            data=data,
            headers={'Content-Type': 'application/json'}
        )

        response = urllib.request.urlopen(req)
        result = json.loads(response.read())

        return jsonify({
            "id": f"cmpl-{int(time.time())}",
            "object": "text_completion",
            "created": int(time.time()),
            "model": model,
            "choices": [{
                "text": result.get('message', {}).get('content', ''),
                "index": 0,
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": result.get('prompt_eval_count', 0),
                "completion_tokens": result.get('eval_count', 0),
                "total_tokens": result.get('prompt_eval_count', 0) + result.get('eval_count', 0)
            }
        })

    except Exception as e:
        return jsonify({"error": {"message": str(e)}}), 500

@app.route('/health', methods=['GET'])
def health():
    """Saglik kontrolu"""
    return jsonify({"status": "ok", "models": ["qwen2.5-coder:7b", "llama3.2"]})

# ============================================================
# ADIM 6: Sunucuyu Baslat
# ============================================================
def run_server():
    app.run(host='0.0.0.0', port=5000, debug=False)

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

time.sleep(3)
print("\n" + "="*60)
print("OPENAI UYUMLU API BASLATILDI!")
print("="*60)
print("\nDogrudan kullanilabilir:")
print("  http://localhost:5000/v1/chat/completions")
print("  http://localhost:5000/v1/models")

# ============================================================
# ADIM 7: ngrok ile Public URL (Opsiyonel)
# ============================================================
from pyngrok import ngrok

NGROK_TOKEN = ""  # Token girin: https://dashboard.ngrok.com

if NGROK_TOKEN:
    ngrok.set_auth_token(NGROK_TOKEN)

try:
    tunnel = ngrok.connect(5000, bind_tls=True)
    public_url = tunnel.public_url

    print(f"\n{'='*60}")
    print(f"PUBLIC URL: {public_url}")
    print(f"{'='*60}")
    print(f"\nAryaIDE .env dosyasina ekleyin:")
    print(f"  OPENAI_BASE_URL={public_url}/v1")
    print(f"  OPENAI_API_KEY=colab-ollama")
    print(f"\nveya OpenAI provider secip URL girin.")
    print(f"{'='*60}")

except Exception as e:
    print(f"\nngrok hatasi: {e}")
    print("Yerel: http://localhost:5000/v1")

# ============================================================
# ADIM 8: Test
# ============================================================
print("\n" + "="*60)
print("TEST")
print("="*60)

# Model listesi testi
try:
    response = urllib.request.urlopen('http://localhost:5000/v1/models')
    models = json.loads(response.read())
    print("\nMevcut modeller:")
    for m in models.get('data', []):
        print(f"  - {m['id']}")
except Exception as e:
    print(f"Model listesi hatasi: {e}")

# Chat testi
try:
    test_data = json.dumps({
        "model": "qwen2.5-coder:7b",
        "messages": [{"role": "user", "content": "Merhaba! Turkce kisa bir yanit ver."}],
        "max_tokens": 100
    }).encode()

    req = urllib.request.Request(
        'http://localhost:5000/v1/chat/completions',
        data=test_data,
        headers={'Content-Type': 'application/json'}
    )

    response = urllib.request.urlopen(req)
    result = json.loads(response.read())

    print(f"\nChat testi basarili!")
    print(f"Yanit: {result['choices'][0]['message']['content']}")
    print(f"Token: {result['usage']['total_tokens']}")

except Exception as e:
    print(f"Chat testi hatasi: {e}")

print("\n" + "="*60)
print("SUNUCU CALISIYOR!")
print("="*60)
print("\nAryaIDE'ye baglanmak icin:")
print("1. URL'i kopyalayin")
print("2. .env dosyasina ekleyin")
print("3. AryaIDE'yi yeniden baslatin")
