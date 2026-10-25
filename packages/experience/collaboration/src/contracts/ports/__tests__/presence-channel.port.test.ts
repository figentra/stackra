/**
 * Stackra file contract:
 * Purpose: unit tests of the `PresenceChannel` port: a port a presence driver implements and a class token.
 * Boundary: test only; the driver is a hand-rolled one that records what it is asked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2); ADR 0294 (decision 4).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PresenceChannel } from "#contracts/ports/presence-channel.port";
import type { CollaborationCursor } from "#contracts/types/collaboration-cursor.type";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { PresenceLink } from "#contracts/types/presence-link.type";
import type { PresenceLinkHandlers } from "#contracts/types/presence-link-handlers.type";

describe("PresenceChannel", () => {
  it("is a port a presence driver implements", () => {
    const moves: (CollaborationCursor | null)[] = [];
    class RecordingChannel extends PresenceChannel {
      join(_room: CollaborationRoom, handlers: PresenceLinkHandlers): PresenceLink {
        queueMicrotask(() => handlers.onOpen());
        return { move: (cursor) => moves.push(cursor), leave: () => undefined };
      }
    }
    const channel = new RecordingChannel();
    const link = channel.join(
      { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" },
      { onOpen: () => undefined, onPeers: () => undefined, onClose: () => undefined },
    );
    link.move({ x: 1, y: 2 });
    link.move(null);
    link.leave();
    expect(moves).toEqual([{ x: 1, y: 2 }, null]);
    expect(channel).toBeInstanceOf(PresenceChannel);
    expect(channel).toBeInstanceOf(Port);
  });
});
