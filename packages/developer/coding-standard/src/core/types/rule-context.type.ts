/**
 * Stackra file contract:
 * Purpose: the parts of oxlint's rule `context` that the house rules read.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { RuleReport } from "#core/types/rule-report.type";
import type { SourceCode } from "#core/types/source-code.type";

/** What a rule sees of the file it lints. */
export interface RuleContext {
  /** The linted file's path. */
  readonly filename: string;

  /** The linted file's text and comments. */
  readonly sourceCode: SourceCode;

  /** Records a finding. */
  report(report: RuleReport): void;
}
