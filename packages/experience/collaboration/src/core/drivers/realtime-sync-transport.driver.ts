/**
 * Stackra file contract:
 * Purpose: the realtime driver of the `SyncTransport` port (driver name `realtime`): a document stream over its
 *          @stackra/realtime room, each CRDT update an `update` message relayed by the server to the other replicas.
 * Boundary: the room authorises on the server (a viewer's update is refused there, never applied); this driver sends
 *           and receives opaque updates only and never persists one (snapshots are `SnapshotStore`'s). `onOpen` fires
 *           on every welcome, so the owner resends its full state after each reconnect (ADR 0346 decision 6: the CRDT
 *           makes the merge safe). A malformed update from a peer is dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 4, 5 and 7); ADR 0225 (decision 2); ADR 0270 (decisions 5 and 6).
 */
import { Driver } from "@stackra/container";
import { RealtimeConfig } from "@stackra/realtime";

import { RoomTokens } from "#contracts/ports/room-tokens.port";
import { SyncTransport } from "#contracts/ports/sync-transport.port";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { SyncLink } from "#contracts/types/sync-link.type";
import type { SyncLinkHandlers } from "#contracts/types/sync-link-handlers.type";
import { decodeUpdate } from "#core/functions/decode-update.function";
import { encodeUpdate } from "#core/functions/encode-update.function";
import { openRoom } from "#core/functions/open-room.function";

/**
 * Streams document updates through a realtime room.
 *
 * @example
 * const link = transport.open(room, { onOpen: () => link.send(replica.encode()), onUpdate: (u) => replica.apply(u), onClose });
 */
export class RealtimeSyncTransportDriver extends Driver(SyncTransport) {
  private readonly tokens: RoomTokens;

  private readonly config: RealtimeConfig;

  /**
   * @param tokens - issues the room token before each connect.
   * @param config - the longest wait between reconnects (`maxBackoffSeconds`).
   */
  constructor(tokens: RoomTokens, config: RealtimeConfig) {
    super();
    this.tokens = tokens;
    this.config = config;
  }

  /** See `SyncTransport.open`. */
  open(room: CollaborationRoom, handlers: SyncLinkHandlers): SyncLink {
    const link = openRoom(
      this.tokens,
      room,
      {
        onWelcome: () => handlers.onOpen(),
        onFrame: (frame) => {
          if (frame.t !== "update") return;
          const update = decodeUpdate(frame.data);
          if (update !== undefined) handlers.onUpdate(update);
        },
        onDown: () => handlers.onClose(),
      },
      { maxBackoffSeconds: this.config.maxBackoffSeconds },
    );
    return {
      send: (update) => link.send({ t: "update", data: encodeUpdate(update) }),
      close: () => link.close(),
    };
  }
}
