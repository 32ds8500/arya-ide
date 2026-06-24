import PostHog from "posthog-node";

let client: PostHog | null = null;

export function initPostHog() {
  if (client) return client;

  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST ?? "https://app.posthog.com";

  if (!apiKey) {
    console.warn("[PostHog] No API key provided, analytics disabled");
    return null;
  }

  client = new PostHog(apiKey, {
    host,
    flushAt: 20,
    flushInterval: 10000,
  });

  console.log("[PostHog] Initialized");
  return client;
}

export function getPostHogClient(): PostHog | null {
  if (!client) {
    client = initPostHog();
  }
  return client;
}

export function trackEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const ph = getPostHogClient();
  if (!ph) return;

  ph.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      app: "arya-ide",
      timestamp: new Date().toISOString(),
    },
  });
}

export function identifyUser(
  distinctId: string,
  properties: Record<string, unknown>
) {
  const ph = getPostHogClient();
  if (!ph) return;

  ph.identify({
    distinctId,
    properties,
  });
}

export function resetUser(distinctId: string) {
  const ph = getPostHogClient();
  if (!ph) return;

  ph.reset();
}

export function shutdownPostHog() {
  if (client) {
    client.shutdown();
    client = null;
  }
}
