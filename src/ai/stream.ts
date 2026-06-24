export interface StreamChunk {
  data: string;
  done: boolean;
  metadata?: Record<string, any>;
}

export interface StreamController {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
}

export function createStream(): ReadableStream<Uint8Array> {
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    }
  });

  return stream;
}

export function createStreamWriter(stream: ReadableStream<Uint8Array>): StreamController {
  const controller = stream.getReader();
  const encoder = new TextEncoder();

  return {
    controller: null as any,
    encoder
  };
}

export function parseSSE(line: string): StreamChunk | null {
  if (!line.startsWith('data: ')) {
    return null;
  }

  const data = line.slice(6);

  if (data === '[DONE]') {
    return { data: '', done: true };
  }

  try {
    const parsed = JSON.parse(data);
    return {
      data: parsed.choices?.[0]?.delta?.content || parsed.response || '',
      done: false,
      metadata: parsed.usage ? { usage: parsed.usage } : undefined
    };
  } catch {
    return { data: data, done: false };
  }
}

export function createSSEStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      (controller as any)._send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      (controller as any)._sendObject = (obj: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      (controller as any)._done = () => {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      };
    }
  });
}

export function createTokenStream(
  onToken: (token: string) => void,
  onDone?: (fullText: string) => void,
  onError?: (error: Error) => void
): WritableStream<string> {
  let fullText = '';

  return new WritableStream({
    write(chunk) {
      fullText += chunk;
      onToken(chunk);
    },
    close() {
      onDone?.(fullText);
    },
    abort(err) {
      onError?.(err);
    }
  });
}

export async function transformStream<T>(
  input: ReadableStream<T>,
  transform: (chunk: T) => T | Promise<T>
): Promise<ReadableStream<T>> {
  const reader = input.getReader();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const transformed = await transform(value);
        controller.enqueue(transformed as any);
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

export function mergeStreams(
  ...streams: ReadableStream<string>[]
): ReadableStream<string> {
  let activeStreams = streams.length;
  const readerMap = new WeakMap<ReadableStream<string>, ReadableStreamDefaultReader<string>>();

  return new ReadableStream({
    async pull(controller) {
      for (const stream of streams) {
        if (!readerMap.has(stream)) {
          readerMap.set(stream, stream.getReader());
        }
        const reader = readerMap.get(stream)!;

        try {
          const { done, value } = await reader.read();
          if (done) {
            activeStreams--;
            if (activeStreams === 0) {
              controller.close();
            }
            continue;
          }
          controller.enqueue(value);
          return;
        } catch {
          continue;
        }
      }
    }
  });
}

export async function* streamToAsyncIterator(
  stream: ReadableStream<string>
): AsyncGenerator<string> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

export function createBufferedStream(
  stream: ReadableStream<string>,
  bufferSize: number = 100
): ReadableStream<string> {
  let buffer: string[] = [];

  return new ReadableStream({
    start(controller) {
      const reader = stream.getReader();
      const encoder = new TextEncoder();

      const processBuffer = () => {
        if (buffer.length >= bufferSize) {
          const chunk = buffer.join('');
          buffer = [];
          controller.enqueue(chunk);
        }
      };

      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer.length > 0) {
              controller.enqueue(buffer.join(''));
            }
            controller.close();
            return;
          }

          buffer.push(value);
          processBuffer();
        }
      };

      pump().catch(err => controller.error(err));
    }
  });
}

export function throttleStream(
  stream: ReadableStream<string>,
  ms: number
): ReadableStream<string> {
  let lastTime = 0;
  let buffer = '';

  return new ReadableStream({
    start(controller) {
      const reader = stream.getReader();

      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (buffer) controller.enqueue(buffer);
            controller.close();
            return;
          }

          buffer += value;
          const now = Date.now();
          if (now - lastTime >= ms) {
            controller.enqueue(buffer);
            buffer = '';
            lastTime = now;
          }
        }
      };

      pump().catch(err => controller.error(err));
    }
  });
}
