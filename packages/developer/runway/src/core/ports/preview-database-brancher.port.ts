/**
 * Stackra file contract:
 * Purpose: the `PreviewDatabaseBrancher` port: creates, connects to and removes the database branch of one
 *          pull request's preview (`previewDatabaseOf` with `from: branch`).
 * Boundary: an abstract class that is its own token; the Neon driver is `@stackra/runway/node`'s and runs `neonctl`.
 *           `create` and `remove` are idempotent, so a re-run deploy or a twice-closed pull request is safe. The
 *           connection string carries a password: the caller writes it straight into the preview's secret store and
 *           never logs it.
 * Runtime: isomorphic
 * Governing contract: ADR 0238 (decision 1: Neon is allowed), ADR 0263 (ports resolve by type), ADR 0352 (decision 3).
 */
import { Port } from "@stackra/contracts";

import type { PreviewDatabase } from "#core/types/preview-database.type";

/** A preview database that is a branch. */
type BranchDatabase = Extract<PreviewDatabase, { from: "branch" }>;

/** The branching service of preview databases. */
export abstract class PreviewDatabaseBrancher extends Port {
  /** The service it drives, as `shared.database.branch.provider` names it. */
  abstract readonly provider: string;

  /** Creates the branch unless it exists. */
  abstract create(database: BranchDatabase): Promise<void>;

  /** The branch's Postgres connection string; a secret. */
  abstract connectionString(database: BranchDatabase): Promise<string>;

  /** Removes the branch when it exists. */
  abstract remove(database: BranchDatabase): Promise<void>;
}
