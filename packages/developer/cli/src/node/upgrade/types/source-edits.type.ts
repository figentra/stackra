/**
 * Stackra file contract:
 * Purpose: `SourceEdits`, what the source codemods of an upgrade answer for a whole workspace: the files they change
 *          and the places they leave to a person.
 * Boundary: type only; `collectSourceEdits` builds it.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import type { UpgradeFileEdit } from "#node/upgrade/types/upgrade-file-edit.type";
import type { UpgradeFinding } from "#node/upgrade/types/upgrade-finding.type";

/** The source codemods' work. */
export type SourceEdits = {
  /** The files changed, in path order. */
  readonly edits: readonly UpgradeFileEdit[];

  /** The places to change by hand, in path order. */
  readonly findings: readonly UpgradeFinding[];
};
