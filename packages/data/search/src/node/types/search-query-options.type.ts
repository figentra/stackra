/**
 * Stackra file contract:
 * Purpose: `SearchQueryOptions`, what `SearchQuery(Model, options)` takes beyond the model: any `Query({...})` option,
 *          with the key and the actors optional because the search query derives them.
 * Boundary: a type only. The key defaults to `<model>.search` in snake_case and the actors to a signed-in user, an agent
 *           and another service, in the app API area. A public search (ADR 0221 d6) is the same query declared with
 *           `actors` that include `ActorKind.Anonymous` and `area: ApiArea.Public`; nothing else changes, because
 *           visibility stays row-level security and the record visibility the index applies.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 4 and 6, settled 2026-10-29); ADR 0294 (decision 25); ADR 0082 (the public area).
 */
import type { QueryOptions } from "@stackra/actions";
import type { ActorKind } from "@stackra/contracts";

/** The options of a model's search query. */
export interface SearchQueryOptions extends Omit<QueryOptions, "key" | "actors"> {
  /** `<model>.<name>` in snake_case; `<model>.search` from the model's class name when absent. */
  readonly key?: string | undefined;

  /** The actor kinds that may call it; a user, an agent and a service when absent. */
  readonly actors?: readonly ActorKind[] | undefined;
}
