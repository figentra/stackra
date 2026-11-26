/**
 * Stackra file contract:
 * Purpose: `SourceCodemodResult`, what the codemods did to one source file: its new text, the codemods that changed
 *          it and the places left to a person.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import type { UpgradeFinding } from "#node/upgrade/types/upgrade-finding.type";

/** One file after the codemods. */
export type SourceCodemodResult = {
  /** The text after every codemod; the input text when none changed it. */
  readonly text: string;

  /** The ids of the codemods that changed the text, in run order. */
  readonly changedBy: readonly string[];

  /** The places to change by hand. */
  readonly findings: readonly UpgradeFinding[];
};
