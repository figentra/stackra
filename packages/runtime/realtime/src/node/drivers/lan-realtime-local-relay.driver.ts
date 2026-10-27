/**
 * Stackra file contract:
 * Purpose: the `lan` driver of the `RealtimeLocalRelay` port: one venue device (a till, a kitchen display host) serves a
 *          realtime relay on the local network, and the others find it by probing the venue's configured peers. Linked
 *          devices read refreshes as the `sse` driver writes them (`GET <REALTIME_PATH>?token=<key>`, `event: refresh`),
 *          so `WebsocketRealtimeTransportDriver` links unchanged (the socket attempt fails, the event-stream fallback
 *          opens); a device relays a refresh to all of them with `POST <REALTIME_PATH>` and the key as a bearer token.
 * Boundary: node:http and node:os only, no new dependency. Every request must carry the venue key
 *           (`REALTIME_LOCAL_RELAY_KEY`, compared in constant time); without the secret the relay refuses to host or
 *           probe. The relay keeps nothing: a message reaches the devices linked at that moment, and a device that was
 *           away refetches, as with any refresh (ADR 0225 decision 2). Every linked device is in the venue's one scope;
 *           the relay does not filter channels. Discovery is the configured peer list (`localRelayPeers`), probed in
 *           order with `HEAD`; there is no multicast discovery. A message body over 64 KiB or not a refresh is refused.
 * Runtime: node
 * Governing contract: ADR 0225 (decision 1: WebSocket with an SSE fallback; decision 2: data-free refreshes); ADR 0294
 *                     (decisions 4, 15 and 16); ADR 0173 (secrets by name).
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { networkInterfaces } from "node:os";

import { Driver } from "@stackra/container";

import type { RealtimeConfig } from "#config/realtime.config";
import { RealtimeLocalRelay } from "#contracts/ports/realtime-local-relay.port";
import type { RealtimeTarget } from "#contracts/types/realtime-target.type";
import { REALTIME_PATH } from "#core/constants/realtime-path.constant";
import { decodeMessage } from "#core/functions/decode-message.function";

/** The largest message a device may relay, in bytes. */
const MAX_BODY_BYTES = 65_536;

/** How often a comment line keeps an idle stream alive. */
const HEARTBEAT_MS = 25_000;

/** The SHA-256 of `text`, so two keys of any length compare in constant time. */
function digest(text: string): Buffer {
  return createHash("sha256").update(text).digest();
}

/**
 * Relays refreshes between the devices of one venue.
 *
 * @example
 * const relay = (await localRelay.discover()) ?? (await localRelay.host());
 * connection.start(() => Promise.resolve(relay)); // or transport.open(relay, handlers)
 */
export class LanRealtimeLocalRelayDriver extends Driver(RealtimeLocalRelay) {
  private readonly config: RealtimeConfig;

  private server: Server | undefined;

  private readonly streams = new Set<ServerResponse>();

  /**
   * @param config - the venue key, the port, the advertised address, the peers and the probe timeout.
   */
  constructor(config: RealtimeConfig) {
    super();
    this.config = config;
  }

  /**
   * Starts serving the relay on `localRelayPort` (once) and answers the address the other devices link to.
   *
   * @throws TypeError when the `REALTIME_LOCAL_RELAY_KEY` secret is not set.
   */
  async host(): Promise<RealtimeTarget> {
    const key = this.key();
    if (this.server === undefined) {
      const server = createServer((request, response) => this.handle(request, response));
      this.server = server;
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(this.config.localRelayPort, () => {
          server.off("error", reject);
          resolve();
        });
      });
    }
    return { origin: `http://${this.address()}:${this.config.localRelayPort}`, token: key };
  }

  /**
   * The first configured peer that answers a keyed probe within `localRelayProbeMs`, or null.
   *
   * @throws TypeError when the `REALTIME_LOCAL_RELAY_KEY` secret is not set.
   */
  async discover(): Promise<RealtimeTarget | null> {
    const key = this.key();
    for (const origin of this.config.localRelayPeers) {
      try {
        // oxlint-disable-next-line no-await-in-loop -- peers are probed in their configured order
        const answer = await fetch(`${origin}${REALTIME_PATH}`, {
          method: "HEAD",
          headers: { authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(this.config.localRelayProbeMs),
        });
        if (answer.ok) return { origin, token: key };
      } catch {
        // An unreachable or slow peer: try the next one.
      }
    }
    return null;
  }

  /** Stops serving: open streams end and the port is released. */
  async stop(): Promise<void> {
    for (const stream of this.streams) stream.end();
    this.streams.clear();
    const server = this.server;
    this.server = undefined;
    if (server !== undefined)
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
  }

  /** Answers one request: HEAD probes, GET links, POST relays; anything else is refused. */
  private handle(request: IncomingMessage, response: ServerResponse): void {
    const url = new URL(request.url ?? "/", "http://relay.invalid");
    if (url.pathname !== REALTIME_PATH) {
      response.writeHead(404).end();
      return;
    }
    const bearer = /^Bearer (.+)$/.exec(request.headers.authorization ?? "")?.[1];
    if (!this.allows(bearer ?? url.searchParams.get("token") ?? "")) {
      response.writeHead(401).end();
      return;
    }
    if (request.method === "HEAD") response.writeHead(204).end();
    else if (request.method === "GET") this.link(response);
    else if (request.method === "POST") this.relay(request, response);
    else response.writeHead(405).end();
  }

  /** Opens an event stream to one device. */
  private link(response: ServerResponse): void {
    response.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
    });
    response.write(": open\n\n");
    this.streams.add(response);
    const heartbeat = setInterval(() => response.write(": ping\n\n"), HEARTBEAT_MS);
    response.on("close", () => {
      clearInterval(heartbeat);
      this.streams.delete(response);
    });
  }

  /** Reads one refresh and writes it to every linked device. */
  private relay(request: IncomingMessage, response: ServerResponse): void {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        response.writeHead(413).end();
        request.destroy();
      } else chunks.push(chunk);
    });
    request.on("end", () => {
      if (response.writableEnded) return;
      const message = decodeMessage(Buffer.concat(chunks).toString("utf8"));
      if (message === undefined) {
        response.writeHead(400).end();
        return;
      }
      const event = `id: ${message.id}\nevent: refresh\ndata: ${JSON.stringify(message)}\n\n`;
      for (const stream of this.streams) stream.write(event);
      response.writeHead(202).end();
    });
  }

  /** Whether `candidate` is the venue key. */
  private allows(candidate: string): boolean {
    const key = this.config.localRelayKey;
    return key !== "" && timingSafeEqual(digest(candidate), digest(key));
  }

  /** This device's advertised address: the configured one, else its first non-internal IPv4 address. */
  private address(): string {
    if (this.config.localRelayAddress !== "") return this.config.localRelayAddress;
    for (const list of Object.values(networkInterfaces()))
      for (const each of list ?? [])
        if (each.family === "IPv4" && !each.internal) return each.address;
    return "127.0.0.1";
  }

  /**
   * The venue key.
   *
   * @throws TypeError when the secret is not set.
   */
  private key(): string {
    if (this.config.localRelayKey === "")
      throw new TypeError(
        "The lan realtime local relay needs a venue key: set the REALTIME_LOCAL_RELAY_KEY secret",
      );
    return this.config.localRelayKey;
  }
}
