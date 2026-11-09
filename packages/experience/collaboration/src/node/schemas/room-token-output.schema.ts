/**
 * Stackra file contract:
 * Purpose: `RoomTokenOutput`, the answer of `collaboration.room.token`: the `RealtimeTarget` the collaboration drivers
 *          connect with, the realtime origin and the one-time room token.
 * Boundary: a shape class whose fields are exactly `RealtimeTarget`'s. The token is a credential for one join: never
 *           log it.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 3); ADR 0225 (decision 1); ADR 0305 (Output in its own file).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * Where to connect and with what.
 *
 * @example
 * return RoomTokenOutput.create({ origin: config.origin, token });
 */
export class RoomTokenOutput extends Schema {
  /** The one-time room token. */
  @Str({ min: 1 })
  token!: string;

  /** The realtime origin (`https://api.acme.example`); empty for the page's own origin. */
  origin!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[RoomTokenOutput, z.object({ origin: z.string(), token: z.string().min(1) })]]);
