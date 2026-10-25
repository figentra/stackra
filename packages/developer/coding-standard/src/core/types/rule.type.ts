/**
 * Stackra file contract:
 * Purpose: one house lint rule: its metadata and the visitor it builds for each file.
 * Boundary: a structural type matching the oxlint JS plugin API (`create` form); no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { RuleContext } from "#core/types/rule-context.type";
import type { RuleMeta } from "#core/types/rule-meta.type";

/** A lint rule oxlint runs once per file. */
export interface Rule {
  /** What the rule checks and how it reports. */
  readonly meta: RuleMeta;

  /** Builds the visitor for one file: node type to handler. */
  create(context: RuleContext): Readonly<Record<string, (node: AstNode) => void>>;
}
