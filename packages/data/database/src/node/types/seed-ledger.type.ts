/**
 * Stackra file contract:
 * Purpose: `SeedLedger`, where `runSeeders` reads the checksum each seeder last ran with and records a run.
 * Boundary: a type only; `seederLedger()` is the one over `seed_records`. `record` runs inside the seeder's
 *           transaction, so a seeder and its ledger row commit together or not at all.
 * Runtime: node
 * Governing contract: ADR 0325 (decision 7: seeds are resumable); STA-1709.
 */

/** The applied seeders of a member. */
export interface SeedLedger {
  /** Each applied seeder key with the checksum it last ran with. */
  readonly applied: (member: string) => Promise<ReadonlyMap<string, string>>;

  /** Records that `key` ran with `checksum`, by `ranBy`, inside the running transaction. */
  readonly record: (
    member: string,
    run: {
      readonly key: string;
      readonly profile: string;
      readonly checksum: string;
      readonly ranBy: string;
    },
  ) => Promise<void>;
}
