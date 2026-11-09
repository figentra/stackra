/**
 * Stackra file contract:
 * Purpose: `RoomTokenInput`, the input of `collaboration.room.token`: the public id of the document whose room the
 *          caller wants to join.
 * Boundary: a shape class; it names no model, scope or principal: the id's prefix names the collaborative model, the
 *           call's tenant is the session's and the principal is the verified caller.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 3); ADR 0294 (decisions 6 and 21); ADR 0305 (one declaration per file).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/**
 * Which document's room.
 *
 * @example
 * RoomTokenInput.create({ document: "tpl_01j9z3k4m5n6p7q8r9s0t1v2w3" });
 */
export class RoomTokenInput extends Schema {
  /** The document's public id (`tpl_…`). */
  @Str({
    min: 3,
    max: 64,
  })
  document!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[RoomTokenInput, z.object({ document: z.string().min(3).max(64) })]]);
