/**
 * Stackra file contract:
 * Purpose: `FreezeAccountOutput`, the output of `loyalty_kit.account.freeze@1`: the account and whether it is frozen
 *          now.
 * Boundary: a shape class in its own file. It registers its schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0328.
 */
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * The flag after the call.
 *
 * @example
 * return FreezeAccountOutput.create({ accountId: account.id, isFrozen: account.isFrozen });
 */
export class FreezeAccountOutput extends Schema {
  /** The account's public id. */
  accountId!: PublicId<"lac">;

  /** Whether the account is frozen now. */
  isFrozen!: boolean;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [FreezeAccountOutput, z.object({ accountId: publicId("lac"), isFrozen: z.boolean() })],
]);
