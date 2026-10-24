/**
 * Stackra file contract:
 * Purpose: unit tests of the `SyncTransport` port: a port a document stream driver implements and a class token.
 * Boundary: test only; the driver is a hand-rolled one that records the updates it is sent.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2); ADR 0294 (decision 4).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SyncTransport } from "#contracts/ports/sync-transport.port";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { SyncLink } from "#contracts/types/sync-link.type";
import type { SyncLinkHandlers } from "#contracts/types/sync-link-handlers.type";

describe("SyncTransport", () => {
  it("is a port a document stream driver implements", () => {
    const sent: Uint8Array[] = [];
    class RecordingTransport extends SyncTransport {
      open(_room: CollaborationRoom, _handlers: SyncLinkHandlers): SyncLink {
        return { send: (update) => sent.push(update), close: () => undefined };
      }
    }
    const transport = new RecordingTransport();
    const link = transport.open(
      { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" },
      { onOpen: () => undefined, onUpdate: () => undefined, onClose: () => undefined },
    );
    link.send(new Uint8Array([1, 2]));
    link.close();
    expect(sent).toEqual([new Uint8Array([1, 2])]);
    expect(transport).toBeInstanceOf(SyncTransport);
    expect(transport).toBeInstanceOf(Port);
  });
});
