/**
 * Stackra file contract:
 * Purpose: `LintRule`, one oxlint JS-plugin rule in the `create` form: its metadata and the visitor it builds per file.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (house rules as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { LintNode } from "#lint/types/lint-node.type";

/** A rule oxlint runs once per file. */
export interface LintRule {
  /** What it checks and how it reports. */
  readonly meta: {
    readonly type: "problem" | "suggestion";
    readonly docs: { readonly description: string };
    readonly messages: Readonly<Record<string, string>>;
    readonly schema: readonly [];
  };

  /** Builds the visitor for one file. */
  create(context: {
    report(report: {
      node: LintNode;
      messageId: string;
      data?: Readonly<Record<string, string>>;
    }): void;
  }): Readonly<Record<string, (node: LintNode) => void>>;
}
