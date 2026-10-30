/**
 * Stackra file contract:
 * Purpose: `PageContextSources`, what `resolvePageContext` reads through: the caller's `Facts` lookup, the field
 *          allow-list per data class, and the token budget the context may use.
 * Boundary: a type only; the ai service builds it per turn for the agent's principal, from the `Facts` classes it
 *           discovered and the product's allow-list data. This package holds no lookup, list or budget of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 6); ADR 0360 (decision 15: a field allow-list per data class); ADR 0245
 *                     (decision 7: `Facts`); STA-1631.
 */
import type { ContextFacts } from "#core/types/context-facts.type";
import type { FieldAllowList } from "#core/types/field-allow-list.type";

/** The sources of one page context resolution. */
export interface PageContextSources {
  /**
   * The facts of the record `id`, under the caller's permissions, with the data class they belong to; `undefined` when
   * no `Facts` class serves the id's prefix. A refusal it throws (forbidden, not found) means the caller may not read
   * the record: the id is dropped.
   */
  readonly provide: (
    id: string,
  ) => Promise<{ readonly dataClass: string; readonly facts: ContextFacts } | undefined>;

  /** The fields of each data class that may reach a model. */
  readonly allowList: FieldAllowList;

  /** The most tokens the resolved records may use; the rest are omitted. */
  readonly budgetTokens: number;
}
