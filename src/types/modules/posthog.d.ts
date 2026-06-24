declare module 'posthog-node' {
  export default class PostHog {
    constructor(apiKey: string, options?: any);
    capture(options: { distinctId: string; event: string; properties?: any }): void;
    identify(options: { distinctId: string; properties?: any }): void;
    reset(): void;
    shutdown(): void;
  }
}
