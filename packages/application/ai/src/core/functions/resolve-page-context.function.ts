/**
 * Stackra file contract:
 * Purpose: `resolvePageContext(context, sources)`, a page context turned into what the model sees: each id the caller
 *          can read loaded through its `Facts` class and cut to the data class's field allow-list, an id the caller
 *          cannot read dropped, and the records held to the token budget.
 * Boundary: pure over the sources it is handed (the `Facts` lookup runs as the caller). Client-sent context is a
 *           pointer, not evidence (ADR 0490 decision 6): an id with no `Facts` class, or one whose lookup refuses, is
 *           dropped, so the model never learns a record exists. The page's record comes first, then the selection, in
 *           order; once the budget is spent the remaining readable records are counted in `omitted`, not loaded
 *           (a later, smaller one is not squeezed in). The token estimate is a quarter of the JSON's length.
 *           shortcut: the estimate is a character count, not the model's tokenizer; use the tokenizer of the routed
 *           model when the budget needs to be exact.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 6); ADR 0360 (decision 15); ADR 0245 (decision 7); STA-1631.
 */
import { allowFields } from "#core/functions/allow-fields.function";
import type { PageContext } from "#core/schemas/page-context.schema";
import type { PageContextSources } from "#core/types/page-context-sources.type";
import type { ResolvedPageContext } from "#core/types/resolved-page-context.type";
import type { ResolvedPageRecord } from "#core/types/resolved-page-record.type";

/** The tokens `value` takes in a prompt, estimated. */
const tokensOf = (value: unknown): number => Math.ceil(JSON.stringify(value).length / 4);

/**
 * The page context as the model may see it.
 *
 * @param context - the page context the SDK sent.
 * @param sources - the facts lookup, allow-list and budget of this turn.
 * @example
 * const seen = await resolvePageContext(context, { provide, allowList: { order: ["status"] }, budgetTokens: 800 });
 */
export async function resolvePageContext(
  context: PageContext,
  sources: PageContextSources,
): Promise<ResolvedPageContext> {
  const wanted = [
    ...new Set([
      ...(context.record === undefined ? [] : [context.record]),
      ...(context.selection?.ids ?? []),
    ]),
  ];
  const records: ResolvedPageRecord[] = [];
  const readable: string[] = [];
  let spent = 0;
  let omitted = 0;
  let full = false;
  for (const id of wanted) {
    const provided = await sources.provide(id).catch(() => undefined);
    if (provided === undefined) continue;
    readable.push(id);
    if (full) {
      omitted += 1;
      continue;
    }
    const record: ResolvedPageRecord = {
      id,
      summary: provided.facts.summary,
      facts: allowFields(provided.facts.facts, provided.dataClass, sources.allowList),
    };
    spent += tokensOf(record);
    if (spent > sources.budgetTokens) {
      full = true;
      omitted += 1;
    } else records.push(record);
  }
  const keep = new Set(readable);
  const { selection } = context;
  return {
    app: context.app,
    route: context.route,
    params: context.params,
    records,
    ...(selection === undefined
      ? {}
      : {
          selection: {
            count: selection.count,
            ids: selection.ids.filter((id) => keep.has(id)),
            dropped: selection.ids.filter((id) => !keep.has(id)).length,
            ...(selection.filter === undefined ? {} : { filter: selection.filter }),
          },
        }),
    ...(context.filters === undefined ? {} : { filters: context.filters }),
    ...(context.view === undefined ? {} : { view: context.view }),
    ...(context.modal === undefined ? {} : { modal: context.modal }),
    omitted,
  };
}
