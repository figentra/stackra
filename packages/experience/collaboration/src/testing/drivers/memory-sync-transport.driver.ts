/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `SyncTransport` port: an in-process relay per document, for tests. It forwards
 *          each update to the other open streams and keeps every update, so a stream that opens late (or reopens)
 *          receives what the others hold, as a server relay would. `peer()` adds a client on the same relays;
 *          `drop()` and `reconnect()` take this driver's streams down and up.
 * Boundary: test code only, so it ships in `./testing`; no network, no authorisation, no parsing of updates. A stream
 *           opens on the next microtask (never before `open` returns); an update sent while it is down is dropped.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0269 (decision 3); ADR 0225 (decision 2).
 */
import { Driver } from "@stackra/container";

import { SyncTransport } from "#contracts/index";
import type { CollaborationRoom, SyncLink, SyncLinkHandlers } from "#contracts/index";

/** One stream of a document. */
interface Stream {
  readonly handlers: SyncLinkHandlers;
  readonly owner: MemorySyncTransportDriver;
  opened: boolean;
}

/** One document's relay. */
interface Relay {
  readonly streams: Set<Stream>;
  readonly history: Uint8Array[];
}

/**
 * Document streams in process.
 *
 * @example
 * const first = new MemorySyncTransportDriver();
 * const second = first.peer();
 */
export class MemorySyncTransportDriver extends Driver(SyncTransport) {
  // Shared with every driver made by `peer`.
  private relays = new Map<string, Relay>();

  /** A driver for another client on the same relays. */
  peer(): MemorySyncTransportDriver {
    const peer = new MemorySyncTransportDriver();
    peer.relays = this.relays;
    return peer;
  }

  /** Opens `room`'s stream; `onOpen` and the held updates follow on the next microtask unless it was closed first. */
  open(room: CollaborationRoom, handlers: SyncLinkHandlers): SyncLink {
    const relay = this.relays.get(room.document) ?? { streams: new Set<Stream>(), history: [] };
    this.relays.set(room.document, relay);
    const stream: Stream = { handlers, owner: this, opened: false };
    relay.streams.add(stream);
    queueMicrotask(() => this.up(relay, stream));
    return {
      send: (update) => {
        if (!stream.opened) return;
        relay.history.push(update);
        for (const other of relay.streams)
          if (other !== stream && other.opened) other.handlers.onUpdate(update);
      },
      close: () => {
        relay.streams.delete(stream);
      },
    };
  }

  /** Takes this driver's streams down, reporting `onClose` to each. */
  drop(): void {
    for (const relay of this.relays.values())
      for (const stream of relay.streams)
        if (stream.owner === this && stream.opened) {
          stream.opened = false;
          stream.handlers.onClose();
        }
  }

  /** Brings this driver's dropped streams up again, as a driver's own reconnect would. */
  reconnect(): void {
    for (const relay of this.relays.values())
      for (const stream of relay.streams) if (stream.owner === this) this.up(relay, stream);
  }

  /** Opens `stream` if it is still on the relay and down, then delivers what the relay held before. */
  private up(relay: Relay, stream: Stream): void {
    if (!relay.streams.has(stream) || stream.opened) return;
    const held = [...relay.history];
    stream.opened = true;
    stream.handlers.onOpen();
    for (const update of held) stream.handlers.onUpdate(update);
  }
}
