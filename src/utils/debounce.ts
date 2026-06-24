// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export function debounce<T extends AnyFunction>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function debounceLeading<T extends AnyFunction>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId === null) {
      fn(...args);
    }

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
    }, delay);
  };
}

export function throttle<T extends AnyFunction>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

export function throttleTrailing<T extends AnyFunction>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (!inThrottle) {
      fn(...args);
      inThrottle = true;

      timeoutId = setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    }
  };
}

export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let resolve: ((value: ReturnType<T>) => void) | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((res) => {
      resolve = res;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        resolve?.(result as ReturnType<T>);
      }, delay);
    });
  };
}

export function batch<T>(
  fn: (items: T[]) => void,
  delay: number,
  maxBatchSize?: number
): (item: T) => void {
  let batch: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (item: T) => {
    batch.push(item);

    if (maxBatchSize && batch.length >= maxBatchSize) {
      if (timeoutId) clearTimeout(timeoutId);
      fn(batch);
      batch = [];
      return;
    }

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        if (batch.length > 0) fn(batch);
        batch = [];
        timeoutId = null;
      }, delay);
    }
  };
}
