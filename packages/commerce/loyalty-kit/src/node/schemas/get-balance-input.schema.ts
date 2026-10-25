/**
 * Stackra file contract:
 * Purpose: `GetBalanceInput`, the input of `loyalty_kit.points.balance@1`: whose balance.
 * Boundary: a shape class in its own file; a customer may pass only their own account, which the record check in
 *           `handle` enforces, not this shape. The output is `BalanceView` (core, shared with the renderers). It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file).
 */
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * The account to read.
 *
 * @example
 * GetBalanceInput.create({ accountId });
 */
export class GetBalanceInput extends Schema {
  /** The account's public id; the path parameter of every loyalty account route. */
  accountId!: PublicId<"lac">;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[GetBalanceInput, z.object({ accountId: publicId("lac") })]]);
