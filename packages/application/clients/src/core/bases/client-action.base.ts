/**
 * Stackra file contract:
 * Purpose: `ClientAction`, the kind factory form of `actionRef` that a public-area generated client uses
 *          (`class CreateLeadAction extends ClientAction({ key: "leads.lead.create", ... }) {}`), with the key inside
 *          the options.
 * Boundary: the same ref as `actionRef`; kept until gen writes one form in every target (STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0305 (kind factories take no `define` prefix).
 */
import { actionRef } from "#core/functions/action-ref.function";
import type { ActionRef } from "#core/types/action-ref.type";
import type { ClientActionOptions } from "#core/types/client-action-options.type";
import type { RefSchema } from "#core/types/ref-schema.type";
import type { SchemaOf } from "#core/types/schema-of.type";

// shortcut: a second spelling of actionRef because two gen revisions emit both; drop one once gen settles (STA-339).
/**
 * A consumed action class.
 *
 * @throws RangeError when `key` is not a call key.
 * @example
 * export class CreateLeadAction extends ClientAction({
 *   key: "leads.lead.create",
 *   input: CreateLeadInput$,
 *   output: z.object({ leadId: z.string() }),
 *   http: { method: HttpMethod.Post, path: "/public/leads" },
 * }) {}
 */
export function ClientAction<I extends RefSchema, O extends RefSchema>(
  options: ClientActionOptions<I, O>,
): ActionRef<SchemaOf<I>, SchemaOf<O>> {
  const { key, ...rest } = options;
  return actionRef(key, rest);
}
