/**
 * Stackra file contract:
 * Purpose: `ClientActionOptions<I, O>`, the one argument of `ClientAction({...})`: the action ref options with the key
 *          inside.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0305 (kind factories take no `define` prefix).
 */
import type { ActionRefOptions } from "#core/types/action-ref-options.type";
import type { RefSchema } from "#core/types/ref-schema.type";

/** What `ClientAction` declares. */
export interface ClientActionOptions<
  I extends RefSchema,
  O extends RefSchema,
> extends ActionRefOptions<I, O> {
  /** The action key (`leads.lead.create`). */
  readonly key: string;
}
