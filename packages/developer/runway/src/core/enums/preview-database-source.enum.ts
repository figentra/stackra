/**
 * Stackra file contract:
 * Purpose: the sources of a preview's database, the values `environments.preview.shared.database.from` names: a
 *          fresh database filled from the product's seed pack, or a copy-on-write branch of another database.
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0238 (decision 1: Neon is an allowed server), ADR 0159 (rollback on preview databases).
 */
import { Enum } from "@stackra/contracts";

/** One case per source. */
export const PreviewDatabaseSource = Enum.of({
  /** A fresh database, migrated by the deploy and filled by `stackra seed-pack <product> --profile <profile>`. */
  SeedPack: "seed-pack",
  /** A copy-on-write branch of the parent database (Neon), named after the pull request's branch. */
  Branch: "branch",
});

/** One of the codes above. */
export type PreviewDatabaseSource = Enum.Value<typeof PreviewDatabaseSource>;
