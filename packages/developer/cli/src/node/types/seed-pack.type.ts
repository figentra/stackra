/**
 * Stackra file contract:
 * Purpose: `SeedPack`, a product's seed pack as read from its folder: the pack key (`seed-pack:<product>`), the
 *          product, its semantic version and every record of every profile folder.
 * Boundary: a type only; `readSeedPack` builds it and refuses a pack that breaks the rules.
 * Runtime: node
 * Governing contract: config-model section 6; ADR 0325 (decision 7); ADR 0190.
 */
import type { SeedRecord } from "#node/types/seed-record.type";

/** One product seed pack. */
export type SeedPack = {
  /** The pack key, `seed-pack:<product>`. */
  readonly key: string;

  /** The product key. */
  readonly product: string;

  /** The pack's semantic version, versioned with the product. */
  readonly version: string;

  /** Every record, sorted by profile folder, then file. */
  readonly records: readonly SeedRecord[];
};
