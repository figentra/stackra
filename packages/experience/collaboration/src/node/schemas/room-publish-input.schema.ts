/**
 * Stackra file contract:
 * Purpose: `RoomPublishInput`, the input of `collaboration.room.publish`: the publish key from the member's `welcome`,
 *          the message kind and its data, as a socket member would send them.
 * Boundary: a shape class; it names no sender, document or scope: the key names the membership the room endpoint
 *           granted, and the server stamps the sender. The data is relayed unread, bounded by the room's size cap.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 4 and 5); ADR 0294 (decision 21); ADR 0305 (one declaration per file).
 */
import type { RoomMessageKind } from "@stackra/realtime/contracts";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * A member's message, sent through the action.
 *
 * @example
 * RoomPublishInput.create({ key, t: "presence", data: { cursor: 4 } });
 */
export class RoomPublishInput extends Schema {
  /** The publish key from the member's `welcome` frame. */
  key!: string;

  /** The message kind: `presence`, `awareness` or `update`. */
  t!: RoomMessageKind;

  /** The message payload, relayed unread. */
  data: unknown = null;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    RoomPublishInput,
    z.object({
      key: z.string().min(1).max(64),
      t: z.enum(["presence", "awareness", "update"]),
      data: z.unknown().default(null),
    }),
  ],
]);
