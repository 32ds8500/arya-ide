export interface Metric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

export interface Counter {
  name: string;
  value: number;
  labels: Record<string, string>;
}

export interface Histogram {
  name: string;
  values: number[];
  labels: Record<string, string>;
}

export class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, { name: string; value: number; labels: Record<string, string> }> = new Map();

  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, { name, value, labels });
    }
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    const existing = this.histograms.get(key);
    if (existing) {
      existing.values.push(value);
    } else {
      this.histograms.set(key, { name, values: [value], labels });
    }
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = `${name}:${JSON.stringify(labels)}`;
    this.gauges.set(key, { name, value, labels });
  }

  getCounter(name: string): number {
    let total = 0;
    for (const counter of this.counters.values()) {
      if (counter.name === name) total += counter.value;
    }
    return total;
  }

  getHistogramStats(name: string): { count: number; sum: number; avg: number; min: number; max: number; p50: number; p95: number; p99: number } | null {
    const values: number[] = [];
    for (const hist of this.histograms.values()) {
      if (hist.name === name) values.push(...hist.values);
    }

    if (values.length === 0) return null;

    values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)]
    };
  }

  getGauge(name: string): number | null {
    for (const gauge of this.gauges.values()) {
      if (gauge.name === name) return gauge.value;
    }
    return null;
  }

  getAllMetrics(): { counters: Counter[]; histograms: { name: string; stats: any; labels: Record<string, string> }[]; gauges: { name: string; value: number; labels: Record<string, string> }[] } {
    return {
      counters: Array.from(this.counters.values()),
      histograms: Array.from(this.histograms.values()).map(h => ({
        name: h.name,
        stats: this.getHistogramStats(h.name),
        labels: h.labels
      })),
      gauges: Array.from(this.gauges.values())
    };
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
  }
}

export const metrics = new MetricsCollector();
