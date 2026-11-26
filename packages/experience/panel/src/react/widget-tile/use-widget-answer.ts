/**
 * Stackra file contract:
 * Purpose: `useWidgetAnswer(widget, options)`, one widget's answer on either entry: its query run with its params and
 *          range, refreshed on its events and on its interval.
 * Boundary: platform-free: imports `react` and no UI kit, so the web tile and the native card read the same answer.
 *           The answer comes from `useQuery` (live when the query declares `invalidateOn`); `refreshOn` of an uncached
 *           query and `refreshEvery` are added here.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 14, 17 and 20); ADR 0164 (0294 note: refreshEvery at least 30 seconds).
 */
import { useQuery, type UseQueryResult } from "@stackra/clients/react";
import { useContainer } from "@stackra/container/react";
import { ServerStateCache } from "@stackra/query";
import { useEffect, useEffectEvent } from "react";

import type { TimeRange } from "#core/enums/time-range.enum";
import { widgetInput } from "#core/functions/widget-input.function";
import type { WidgetDescriptor } from "#core/types/widget-descriptor.type";

/**
 * The live answer of `widget` for the `actor` over the `range`.
 *
 * @example
 * const answer = useWidgetAnswer(widget, { actor: { accountId }, range: TimeRange.Last30Days });
 */
export function useWidgetAnswer(
  widget: WidgetDescriptor,
  {
    actor,
    range,
  }: {
    readonly actor?: Readonly<Record<string, unknown>> | undefined;
    readonly range?: TimeRange | undefined;
  },
): UseQueryResult<unknown> {
  const container = useContainer();
  const answer = useQuery(
    widget.query,
    widgetInput(widget, {
      ...(actor === undefined ? {} : { actor }),
      ...(range === undefined ? {} : { range }),
    }),
  );
  const refetch = useEffectEvent(() => {
    void answer.refetch();
  });
  useEffect(() => {
    if (widget.refreshOn.length === 0 || !container.has(ServerStateCache)) return;
    return container
      .get(ServerStateCache)
      .watch({ key: widget.query.key, invalidateOn: widget.refreshOn });
  }, [container, widget.query.key, widget.refreshOn]);
  useEffect(() => {
    if (widget.refreshEveryMs === undefined) return;
    const timer = setInterval(() => refetch(), widget.refreshEveryMs);
    return () => clearInterval(timer);
  }, [widget.refreshEveryMs]);
  return answer;
}
