/**
 * Stackra file contract:
 * Purpose: `ProvenanceSummary`: what the registry browser shows of a version's provenance statement.
 * Boundary: type only.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 9).
 */

/** What the registry browser shows of a version's provenance statement. */
export interface ProvenanceSummary {
  /** The source repository URL (`https://github.com/<owner>/<name>`), or null. */
  readonly repository: string | null;
  /** The source commit SHA, or null. */
  readonly commit: string | null;
  /** The workflow file path, such as `.github/workflows/release.yml`, or null. */
  readonly workflow: string | null;
  /** The git ref the workflow ran on, or null. */
  readonly ref: string | null;
  /** The build run URL, or null. */
  readonly run: string | null;
}
