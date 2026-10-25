/**
 * Stackra file contract:
 * Purpose: `guardFloors`, the final guard on every outcome: each number parameter whose kind names a market-pack floor
 *          is lifted to the floor when it would cross it (below a `min`, above a `max`), and each change is reported
 *          with the law, market and pack version that set the floor.
 * Boundary: pure. The floors are data (`@stackra/market-packs`' `floorsOn`); the check is the only thing in code. A
 *           floor the market does not have leaves the parameter as it is. A floor whose pack value is not a number is
 *           a pack bug and throws rather than let an outcome through unguarded. The outcomes must already be checked
 *           against `rules` (`Rules.checkOutcomes`).
 * Runtime: isomorphic
 * Governing contract: config-model sections 3 and 4 (a rule outcome never crosses a floor; the engine checks it last);
 *                     ADR 0370 (decision 6); ADR 0331 (decision 9).
 */
import type { Json } from "@stackra/contracts";
import { FloorBound } from "@stackra/market-packs";
import type { ResolvedValue } from "@stackra/market-packs";

import type { Decision } from "#core/types/decision.type";
import type { FlooredParam } from "#core/types/floored-param.type";
import type { Outcome } from "#core/types/outcome.type";
import type { Rules } from "#core/values/rules.value";

/**
 * `outcomes` with every floored parameter kept on its side of `floors`.
 *
 * @throws TypeError when an outcome's kind is not registered with `rules`, or a floor's pack value is not a number.
 * @example
 * guardFloors(RETURNS_RULES, [{ kind: "refundWindow", params: { days: 7 } }], floorsOn(resolved, today));
 * // { outcomes: [{ kind: "refundWindow", params: { days: 14 } }], floored: [{ param: "days", from: 7, to: 14, ... }] }
 */
export function guardFloors(
  rules: Rules,
  outcomes: readonly Outcome[],
  floors: readonly ResolvedValue[],
): Pick<Decision, "outcomes" | "floored"> {
  const byKey = new Map(floors.map((floor) => [floor.key, floor]));
  const floored: FlooredParam[] = [];
  const guarded = outcomes.map((outcome) => {
    const kind = rules.outcomeKind(outcome.kind);
    if (kind === undefined)
      throw new TypeError(`guardFloors: ${rules.key} registers no outcome kind ${outcome.kind}`);
    const params: Record<string, Json> = { ...outcome.params };
    for (const [name, param] of Object.entries(kind.params)) {
      const floor = param.floor === undefined ? undefined : byKey.get(param.floor);
      const value = params[name];
      if (floor?.floor === undefined || typeof value !== "number") continue;
      if (typeof floor.value !== "number")
        throw new TypeError(
          `guardFloors: the floor ${floor.key} of ${floor.market} is not a number`,
        );
      const crosses =
        floor.floor.bound === FloorBound.Min ? value < floor.value : value > floor.value;
      if (!crosses) continue;
      params[name] = floor.value;
      floored.push(
        Object.freeze({
          kind: outcome.kind,
          param: name,
          from: value,
          to: floor.value,
          law: floor.floor.law,
          market: floor.market,
          version: floor.version,
        }),
      );
    }
    return Object.freeze({ kind: outcome.kind, params: Object.freeze(params) });
  });
  return { outcomes: Object.freeze(guarded), floored: Object.freeze(floored) };
}
