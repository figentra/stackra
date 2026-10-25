/**
 * Stackra file contract:
 * Purpose: an oxlint JS plugin: its name (the rule prefix) and its rules by name.
 * Boundary: a structural type matching the oxlint JS plugin API; no runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { Rule } from "#core/types/rule.type";

/** The object an oxlint `jsPlugins` entry loads as its default export. */
export interface Plugin {
  /** The plugin name; a rule is enabled as `<name>/<rule>`. */
  readonly meta: { readonly name: string };

  /** The rules, by kebab-case name. */
  readonly rules: Readonly<Record<string, Rule>>;
}
