/**
 * Stackra file contract:
 * Purpose: `I18nNamespace`, one namespace of the merged key tree: its node, the package that ships it and its base
 *          locale.
 * Boundary: a type only; `i18nTree` builds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: typed keys); STA-1293; STA-1298.
 */
import type { I18nNode } from "#core/types/i18n-node.type";

/** One namespace of the tree: its node, the package that ships it (absent for the member's own) and its base locale. */
export interface I18nNamespace {
  /** The namespace's node in the tree. */
  readonly node: I18nNode;
  /** The package that ships the namespace; absent for the member's own. */
  readonly package?: string;
  /** The namespace's base locale. */
  readonly base: string;
}
