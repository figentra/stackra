/**
 * Stackra file contract:
 * Purpose: a house rule's metadata: its category, description, autofix kind and messages.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */

/** Describes a rule to oxlint and to the reader. */
export interface RuleMeta {
  /** `problem` for a wrong shape, `suggestion` for a convention, `layout` for whitespace only. */
  readonly type: "problem" | "suggestion" | "layout";

  /** The one-sentence description and the governing ADR. */
  readonly docs: { readonly description: string };

  /** Set when the rule ships an autofix. */
  readonly fixable?: "code" | "whitespace";

  /** The messages, by id; `{{name}}` placeholders are filled from the report's `data`. */
  readonly messages: Readonly<Record<string, string>>;

  /** The options schema; every house rule takes none. */
  readonly schema: readonly [];
}
