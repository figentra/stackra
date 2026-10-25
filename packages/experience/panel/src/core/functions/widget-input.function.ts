/**
 * Stackra file contract:
 * Purpose: `widgetInput(widget, { range, actor })`, the input a tile runs its query with: the widget's fixed params with
 *          their binds resolved, and the selected range when the widget takes one.
 * Boundary: internal: pure; the renderers import it by path. An `actor.<field>` bind reads the facts the host passes; one
 *           it does not pass is left out, so the query refuses the input rather than run on a guess.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14, 18 and 20).
 */
import type { TimeRange } from "#core/enums/time-range.enum";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/** The prefix of an actor bind. */
const ACTOR = "actor.";

/**
 * The query input of `widget`.
 *
 * @example
 * widgetInput(pointsBalance, { actor: { accountId: "lac_01J..." } }); // { accountId: "lac_01J..." }
 */
export function widgetInput(
  widget: WidgetDescriptor,
  context: { readonly range?: TimeRange; readonly actor?: Readonly<Record<string, unknown>> } = {},
): Readonly<Record<string, unknown>> {
  const input: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(widget.params)) {
    if (typeof value === "string" && value.startsWith(ACTOR)) {
      const fact = context.actor?.[value.slice(ACTOR.length)];
      if (fact !== undefined) input[name] = fact;
    } else if (value === "range") {
      if (context.range !== undefined) input[name] = context.range;
    } else input[name] = value;
  }
  // Only a widget that takes a range gets one; the others ignore the picker (ADR 0307 rule 20).
  const takesRange = widget.ranges.length > 0 || widget.range !== undefined;
  const range = context.range ?? widget.range;
  if (takesRange && range !== undefined) input["range"] = range;
  return Object.freeze(input);
}
