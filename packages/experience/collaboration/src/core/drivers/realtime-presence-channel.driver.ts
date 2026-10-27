/**
 * Stackra file contract:
 * Purpose: the realtime driver of the `PresenceChannel` port (driver name `realtime`): presence and cursors over a
 *          document's @stackra/realtime room. Each member announces `presence` on welcome and every
 *          `presenceHeartbeatSeconds` (under the room's idle close), answers a newcomer's first presence once, sends
 *          its cursor as `awareness` no faster than `cursorIntervalMilliseconds`, and reports the other members.
 * Boundary: every peer's identity is the server's stamp from the frame; nothing a client claims is used. Presence is
 *           ephemeral: the peer list is rebuilt after every reconnect and nothing is stored. A peer leaves the list on
 *           the room's `left` frame.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 4 to 6); ADR 0225 (decision 2: presence and cursors); ADR 0270 (decision 6).
 *                     Owner D10 2026-10-28 (stackra-223: realtime's `maxBackoff`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { RealtimeConfig } from "@stackra/realtime";
import type { RoomPeerRef } from "@stackra/realtime/contracts";

import type { CollaborationConfig } from "#config/collaboration.config";
import { PresenceChannel } from "#contracts/ports/presence-channel.port";
import type { RoomTokens } from "#contracts/ports/room-tokens.port";
import type { CollaborationCursor } from "#contracts/types/collaboration-cursor.type";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { PresenceLink } from "#contracts/types/presence-link.type";
import type { PresenceLinkHandlers } from "#contracts/types/presence-link-handlers.type";
import type { PresencePeer } from "#contracts/types/presence-peer.type";
import { openRoom } from "#core/functions/open-room.function";

/** A cursor as an `awareness` message carries it, or `null` when off the surface. */
function cursorOf(data: unknown): CollaborationCursor | null {
  const cursor = (data as { readonly cursor?: unknown } | null | undefined)?.cursor;
  if (typeof cursor !== "object" || cursor === null) return null;
  const { x, y } = cursor as { readonly x?: unknown; readonly y?: unknown };
  return typeof x === "number" && typeof y === "number" ? { x, y } : null;
}

/**
 * Presence through a realtime room.
 *
 * @example
 * const link = channel.join(room, { onOpen, onPeers: setPeers, onClose });
 * link.move({ x: 120, y: 48 });
 */
export class RealtimePresenceChannelDriver extends Driver(PresenceChannel) {
  private readonly tokens: RoomTokens;

  private readonly config: CollaborationConfig;

  private readonly realtime: RealtimeConfig;

  /**
   * @param tokens - issues the room token before each connect.
   * @param config - the cursor interval and the presence heartbeat.
   * @param realtime - the longest wait between reconnects.
   */
  constructor(tokens: RoomTokens, config: CollaborationConfig, realtime: RealtimeConfig) {
    super();
    this.tokens = tokens;
    this.config = config;
    this.realtime = realtime;
  }

  /** Joins `room` and reports it through `handlers` (`PresenceChannel.join`). */
  join(room: CollaborationRoom, handlers: PresenceLinkHandlers): PresenceLink {
    const peers = new Map<string, PresencePeer>();
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let pending: ReturnType<typeof setTimeout> | undefined;
    let lastSent = 0;
    let cursor: CollaborationCursor | null = null;
    let open = false;
    const report = () => handlers.onPeers([...peers.values()]);
    const upsert = (from: RoomPeerRef, next: CollaborationCursor | null | undefined): boolean => {
      const known = peers.get(from.peerId);
      peers.set(from.peerId, {
        peerId: from.peerId,
        principalId: from.principalId as PublicId,
        cursor: next === undefined ? (known?.cursor ?? null) : next,
      });
      return known === undefined;
    };
    const link = openRoom(
      this.tokens,
      room,
      {
        onWelcome: () => {
          open = true;
          peers.clear();
          handlers.onOpen();
          report();
          link.send({ t: "presence", data: {} });
          if (cursor !== null) link.send({ t: "awareness", data: { cursor } });
          clearInterval(heartbeat);
          heartbeat = setInterval(
            () => link.send({ t: "presence", data: {} }),
            this.config.presenceHeartbeatSeconds * 1000,
          );
        },
        onFrame: (frame) => {
          if (frame.t === "presence") {
            // A newcomer hears from everyone once, without waiting for their heartbeat.
            if (upsert(frame.from, undefined)) link.send({ t: "presence", data: {} });
          } else if (frame.t === "awareness") upsert(frame.from, cursorOf(frame.data));
          else if (frame.t === "left") peers.delete(frame.peer.peerId);
          else return;
          report();
        },
        onDown: () => {
          open = false;
          clearInterval(heartbeat);
          peers.clear();
          handlers.onClose();
        },
      },
      { maxBackoff: this.realtime.maxBackoff },
    );
    const flush = () => {
      pending = undefined;
      lastSent = Date.now();
      link.send({ t: "awareness", data: { cursor } });
    };
    return {
      move: (next) => {
        cursor = next;
        if (!open || pending !== undefined) return;
        const wait = this.config.cursorIntervalMilliseconds - (Date.now() - lastSent);
        if (wait <= 0) flush();
        else pending = setTimeout(flush, wait);
      },
      leave: () => {
        clearInterval(heartbeat);
        clearTimeout(pending);
        link.close();
      },
    };
  }
}
