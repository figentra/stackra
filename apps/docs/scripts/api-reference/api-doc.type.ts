/**
 * Stackra file contract:
 * Purpose: `ApiDoc`, one TSDoc comment read into the parts the API reference prints: summary,
 *          remarks, parameters, type parameters, returns, yields, throws, examples, deprecation, default and see-also.
 * Boundary: data only; `parseDocComment` fills it and the page renderer reads it.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard, amendment 2026-10-21); STA-2857.
 */
import type { ApiDocNamed } from "#scripts/api-reference/api-doc-named.type";

/** The parts of one TSDoc comment, each in source order. */
export interface ApiDoc {
  /** The text before the first block tag; empty when the comment has none. */
  readonly summary: string;
  /** The `@remarks` text, when present. */
  readonly remarks?: string;
  /** Each `@param` block. */
  readonly params: readonly ApiDocNamed[];
  /** Each `@typeParam` (or `@template`) block. */
  readonly typeParams: readonly ApiDocNamed[];
  /** The `@returns` text, when present. */
  readonly returns?: string;
  /** The `@yields` text, when present. */
  readonly yields?: string;
  /** Each `@throws` text. */
  readonly throws: readonly string[];
  /** Each `@example` body, with its fence when the source wrote one. */
  readonly examples: readonly string[];
  /** The `@deprecated` text (possibly empty) when the symbol is deprecated. */
  readonly deprecated?: string;
  /** The `@defaultValue` (or `@default`) text, when present. */
  readonly defaultValue?: string;
  /** Each `@see` text. */
  readonly see: readonly string[];
  /** True when the comment carries `@internal`: the reference leaves the symbol out. */
  readonly internal: boolean;
}
