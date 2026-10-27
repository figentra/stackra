/**
 * Stackra file contract:
 * Purpose: `FakeWebSocket`, a test stand-in for the browser `WebSocket` the room drivers open: it opens on the next
 *          microtask (or closes unopened while `blocked`), records its URL and what it sent, and lets a test deliver frames and close it.
 * Boundary: test support only, beside the tests that stub `globalThis.WebSocket` with it; never shipped.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */

/** A socket a test drives. */
export class FakeWebSocket {
  /** Every socket opened, in order. */
  static readonly opened: FakeWebSocket[] = [];

  /** When set, each new socket closes without opening, as behind a proxy that blocks WebSockets. */
  static blocked = false;

  readonly url: string;

  readonly sent: unknown[] = [];

  readyState = 1;

  private readonly listeners = new Map<string, ((event: { data?: unknown }) => void)[]>();

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.opened.push(this);
    queueMicrotask(() => {
      if (FakeWebSocket.blocked) this.close();
      else for (const listener of this.listeners.get("open") ?? []) listener({});
    });
  }

  addEventListener(type: string, listener: (event: { data?: unknown }) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(): void {
    this.readyState = 3;
    for (const listener of this.listeners.get("close") ?? []) listener({});
  }

  /** Delivers `frame` as a server frame. */
  receive(frame: unknown): void {
    for (const listener of this.listeners.get("message") ?? [])
      listener({ data: typeof frame === "string" ? frame : JSON.stringify(frame) });
  }
}
