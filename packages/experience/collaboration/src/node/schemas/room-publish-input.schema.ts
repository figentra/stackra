/**
 * Stackra file contract:
 * Purpose: `RoomPublishInput`, the input of `collaboration.room.publish`: the publish key from the member's `welcome`,
 *          the message kind and its data, as a socket member would send them.
 * Boundary: a shape class; it names no sender, document or scope: the key names the membership the room endpoint
 *           granted, and the server stamps the sender. The data is relayed unread, bounded by the room's size cap.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 4 and 5); ADR 0294 (decisions 6 and 21); ADR 0305 (one declaration per file).
 */
import type { RoomMessageKind } from "@stackra/realtime/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * A member's message, sent through the action.
 *
 * @example
 * RoomPublishInput.create({ key, t: "presence", data: { cursor: 4 } });
 */
export class RoomPublishInput extends Schema {
  /** The message kind: `presence`, `awareness` or `update`. */
  // reason: `RoomMessageKind` is a literal union of `@stackra/realtime` that ships no `X$`
  @Field(z.enum(["presence", "awareness", "update"]))
  t!: RoomMessageKind;

  /** The message payload, relayed unread. */
  // reason: the payload is relayed unread, so any value is accepted; the room's size cap bounds it
  @Field(z.unknown())
  data: unknown = null;

  /** The publish key from the member's `welcome` frame. */
  key!: string;
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
