/**
 * Stackra file contract:
 * Purpose: `FreezeAccountInput`, the input of `loyalty_kit.account.freeze@1`: which account and which way.
 * Boundary: a shape class in its own file. It holds the record id, so a panel places the action on the row and the
 *           View page; `isFrozen` has a default, so no modal form opens. It registers its schema when the module loads
 *           (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0164 (placement by
 *                     input).
 */
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * Freezing is the default direction.
 *
 * @example
 * FreezeAccountInput.create({ accountId, isFrozen: false }); // unfreeze
 */
export class FreezeAccountInput extends Schema {
  /** The account's public id; the path parameter. */
  accountId!: PublicId<"lac">;

  /** True freezes, false unfreezes. */
  isFrozen = true;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    FreezeAccountInput,
    z.object({ accountId: publicId("lac"), isFrozen: z.boolean().default(true) }),
  ],
]);
