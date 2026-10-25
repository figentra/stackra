/**
 * Stackra file contract:
 * Purpose: one finding a house rule passes to `context.report`.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { RuleFix } from "#core/types/rule-fix.type";
import type { RuleFixer } from "#core/types/rule-fixer.type";
import type { SourceLocation } from "#core/types/source-location.type";

/** A finding: where it is, which message and an optional autofix. */
export interface RuleReport {
  /** The node the finding points at; give this or `loc`. */
  readonly node?: AstNode;

  /** The span the finding points at, for a comment; give this or `node`. */
  readonly loc?: SourceLocation;

  /** A key of the rule's `meta.messages`. */
  readonly messageId: string;

  /** Values for the `{{placeholders}}` in the message. */
  readonly data?: Readonly<Record<string, string>>;

  /** The autofix, for a rule whose `meta.fixable` is set. */
  readonly fix?: (fixer: RuleFixer) => RuleFix | null;
}
