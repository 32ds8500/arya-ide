export interface Span {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, any>;
  events: SpanEvent[];
  parentSpanId?: string;
}

export interface SpanEvent {
  name: string;
  timestamp: Date;
  attributes?: Record<string, any>;
}

export class Tracer {
  private spans: Map<string, Span> = new Map();
  private activeSpanId: string | null = null;

  startSpan(name: string, attributes: Record<string, any> = {}): string {
    const spanId = `span_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const span: Span = {
      id: spanId,
      name,
      startTime: new Date(),
      status: 'unset',
      attributes,
      events: [],
      parentSpanId: this.activeSpanId || undefined
    };

    this.spans.set(spanId, span);
    this.activeSpanId = spanId;
    return spanId;
  }

  endSpan(spanId: string, status: 'ok' | 'error' = 'ok'): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;

    if (span.parentSpanId) {
      this.activeSpanId = span.parentSpanId;
    } else {
      this.activeSpanId = null;
    }
  }

  addEvent(spanId: string, name: string, attributes?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.events.push({
      name,
      timestamp: new Date(),
      attributes
    });
  }

  setAttribute(spanId: string, key: string, value: any): void {
    const span = this.spans.get(spanId);
    if (!span) return;
    span.attributes[key] = value;
  }

  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  getActiveSpan(): Span | undefined {
    return this.activeSpanId ? this.spans.get(this.activeSpanId) : undefined;
  }

  getCompletedSpans(): Span[] {
    return Array.from(this.spans.values()).filter(s => s.endTime);
  }

  clear(): void {
    this.spans.clear();
    this.activeSpanId = null;
  }
}

export const tracer = new Tracer();
