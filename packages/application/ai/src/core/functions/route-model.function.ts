/**
 * Stackra file contract:
 * Purpose: `routeModel(request, table)`, the model router: the first route for the task (the tenant's own rows, then
 *          the product's in order) that the call's data class allows and that serves the tenant's region, else one
 *          that serves a fallback jurisdiction of the region's rule, disclosed.
 * Boundary: pure; data in, a choice out. In-region always wins over a fallback, across all rows. A data class with an
 *           in-region rule, or a strict in-region request, never falls back; an opt-in jurisdiction is used only when
 *           the tenant opted in. A `credential` request is always refused (`class_closed`). Which providers exist, which regions they serve and the row order are data.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 2); ADR 0360 (decisions 13 to 15); ADR 0494 (a credential is never routed).
 */
import type { ModelRoute } from "#core/types/model-route.type";
import type { RouteChoice } from "#core/types/route-choice.type";
import type { RouteRequest } from "#core/types/route-request.type";
import type { RouteTable } from "#core/types/route-table.type";

/**
 * The route of `request` in `table`.
 *
 * @example
 * routeModel({ task: "chat", region: "me" }, table);
 * // { kind: "routed", route: { provider: "bedrock", ... }, region: "me", disclosed: false }
 */
export function routeModel(request: RouteRequest, table: RouteTable): RouteChoice {
  // A credential never reaches a model, whatever the table says (ADR 0494 rule 5).
  if (request.dataClass === "credential") return { kind: "refused", reason: "class_closed" };
  const classRule =
    request.dataClass === undefined
      ? undefined
      : table.dataClasses.find((rule) => rule.dataClass === request.dataClass);
  if (classRule?.providers !== undefined && classRule.providers.length === 0)
    return { kind: "refused", reason: "class_closed" };

  const candidates = [...(request.overrides ?? []), ...table.routes].filter(
    (route: ModelRoute) =>
      route.task === request.task &&
      (classRule === undefined ||
        ((!classRule.zeroRetentionOnly || route.zeroRetention) &&
          (classRule.providers === undefined || classRule.providers.includes(route.provider)))),
  );

  const local = candidates.find((route) => route.regions.includes(request.region));
  if (local !== undefined)
    return { kind: "routed", route: local, region: request.region, disclosed: false };
  if (request.strictInRegion === true || classRule?.inRegionOnly === true)
    return { kind: "refused", reason: "no_route" };

  const rule = table.regions.find((each) => each.region === request.region);
  const optIns = new Set(request.optIns ?? []);
  for (const jurisdiction of rule?.fallback ?? []) {
    if (rule?.optInRequired.includes(jurisdiction) === true && !optIns.has(jurisdiction)) continue;
    const route = candidates.find((each) => each.regions.includes(jurisdiction));
    if (route !== undefined)
      return { kind: "routed", route, region: jurisdiction, disclosed: true };
  }
  return { kind: "refused", reason: "no_route" };
}
