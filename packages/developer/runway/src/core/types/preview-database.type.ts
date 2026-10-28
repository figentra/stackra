/**
 * Stackra file contract:
 * Purpose: `PreviewDatabase`, how one pull request's preview gets its database, as `previewDatabaseOf` returns it: a
 *          fresh database filled from a seed-pack profile, or a named Neon branch of a parent database.
 * Boundary: type only; plain data, no secret (the branch's connection string is the brancher's answer, not this).
 * Runtime: isomorphic
 * Governing contract: ADR 0238 (decision 1), ADR 0190 (seed-pack profiles).
 */

/** A preview's database. */
export type PreviewDatabase =
  | {
      /** A fresh database the deploy migrates, then the seed pack fills. */
      readonly from: "seed-pack";
      /** The seed-pack profile loaded after `minimal`. */
      readonly profile: "minimal" | "demo" | "test";
    }
  | {
      /** A copy-on-write branch of the parent database. */
      readonly from: "branch";
      /** The branching service. */
      readonly provider: "neon";
      /** The Neon project id. */
      readonly project: string;
      /** The branch it copies (`main`). */
      readonly parent: string;
      /** The preview's branch, `preview-<git branch>` in lower case, 63 characters at most. */
      readonly name: string;
    };
