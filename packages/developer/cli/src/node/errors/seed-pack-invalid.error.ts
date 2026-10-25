/**
 * Stackra file contract:
 * Purpose: `SeedPackInvalidError`, thrown when a product seed pack cannot load: names the pack folder and every issue
 *          (`SeedIssue`), so one run reports them all.
 * Boundary: a plain `Error`, not a refusal: a broken pack is a developer's mistake found before anything is seeded;
 *           `runCli` prints it and exits with 1.
 * Runtime: node
 * Governing contract: ADR 0325 (decision 7: seeds are tested); config-model section 6.
 */
import type { SeedIssue } from "#node/types/seed-issue.type";

/**
 * A seed pack that cannot load.
 *
 * @example
 * try {
 *   readSeedPack("/repo/seed-packs/commerce");
 * } catch (error) {
 *   if (error instanceof SeedPackInvalidError) error.issues; // [{ file, code: "seed_row_answer_missing", message }]
 * }
 */
export class SeedPackInvalidError extends Error {
  /** The pack folder. */
  readonly folder: string;

  /** Every issue, in file order. */
  readonly issues: readonly SeedIssue[];

  /**
   * @param folder - the pack folder.
   * @param issues - what is wrong.
   */
  constructor(folder: string, issues: readonly SeedIssue[]) {
    super(
      `${folder} is not a valid seed pack:\n${issues.map((issue) => `  ${issue.file}: ${issue.code}: ${issue.message}`).join("\n")}`,
    );
    this.name = "SeedPackInvalidError";
    this.folder = folder;
    this.issues = Object.freeze([...issues]);
  }
}
