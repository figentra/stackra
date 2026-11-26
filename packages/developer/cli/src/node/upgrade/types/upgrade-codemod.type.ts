/**
 * Stackra file contract:
 * Purpose: `UpgradeCodemod`, one entry of `UPGRADE_CODEMODS`: the release that carried a breaking change, its upgrade
 *          note, and what `stackra upgrade` does about it: rewrite imports (`renames`, ts-morph), report what a person
 *          must change (`report`, ast-grep), and run commands after the install (`steps`).
 * Boundary: type only. A codemod with none of the three is a note only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import type { CodemodReport } from "#node/upgrade/types/codemod-report.type";
import type { ExportRename } from "#node/upgrade/types/export-rename.type";
import type { UpgradeStep } from "#node/upgrade/types/upgrade-step.type";

/** One breaking change and how a consumer moves past it. */
export type UpgradeCodemod = {
  /** A stable kebab-case id, `--only` takes it. */
  readonly id: string;

  /** The release that carried the change: the codemod runs when an upgrade crosses it. */
  readonly version: string;

  /** One line: what changed. */
  readonly title: string;

  /** The upgrade note: what changed, why, and what is left to a person. */
  readonly note: string;

  /** The changeset and issue that made the change, such as `149ca06, STA-1895`. */
  readonly source: string;

  /** Exports to move or rename in the consumer's imports and re-exports. */
  readonly renames?: readonly ExportRename[];

  /** Code to report for a person to change. */
  readonly report?: CodemodReport;

  /** Commands to run after the install. */
  readonly steps?: readonly UpgradeStep[];
};
