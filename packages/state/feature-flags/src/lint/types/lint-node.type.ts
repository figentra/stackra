/**
 * Stackra file contract:
 * Purpose: `LintNode`, the parts of an oxlint ESTree node the feature-flags lint rule reads.
 * Boundary: a structural type (oxlint does not export its node types); every field but `type` is optional because it
 *           exists only on the node types that carry it. No runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (house rules as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */

/** A syntax tree node as oxlint hands it to a visitor. */
export interface LintNode {
  /** The ESTree node type, such as `CallExpression`. */
  readonly type: string;

  /** An identifier's name. */
  readonly name?: string;

  /** A string literal's value. */
  readonly value?: unknown;

  /** The enclosing node. */
  readonly parent?: LintNode | null;

  /** A call's callee. */
  readonly callee?: LintNode;

  /** A call's arguments. */
  readonly arguments?: readonly LintNode[];

  /** An object literal's properties. */
  readonly properties?: readonly LintNode[];

  /** A property's key. */
  readonly key?: LintNode;

  /** A class's name. */
  readonly id?: LintNode | null;

  /** A class's `extends` expression. */
  readonly superClass?: LintNode | null;
}
