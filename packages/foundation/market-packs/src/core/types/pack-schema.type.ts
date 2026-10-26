/**
 * Stackra file contract:
 * Purpose: `PackSchema`, one section schema of the registry: the key prefix it covers, who owns it, the product
 *          section it belongs to (absent for a base section), and the keys it declares.
 * Boundary: a type only; data, never code. OS registers the base sections (`billing`, `calendar`, `identity`), each
 *           product registers its section (`restaurant`, prefix `restaurant` or `restaurant.tips`). A prefix is
 *           registered once.
 * Runtime: isomorphic
 * Governing contract: ADR 0417 (X2-19); ADR 0370 (decision 1: base packs and product sections).
 */
import type { PackKeySchema } from "#core/types/pack-key-schema.type";

/** One registered section schema. */
export type PackSchema = {
  /** The dotted key prefix every declared key starts with. */
  readonly prefix: string;
  /** The owner: `os` for a base section, the product key for a product section. */
  readonly owner: string;
  /** The product section key when this schema belongs to one; absent for a base section. */
  readonly section?: string;
  /** The declared keys. */
  readonly keys: readonly PackKeySchema[];
};
