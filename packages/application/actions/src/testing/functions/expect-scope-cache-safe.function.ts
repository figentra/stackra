/**
 * Stackra file contract:
 * Purpose: `expectScopeCacheSafe(Query, input, { as: [a, b] })`, the test a query with `cache.per: CacheScope.Scope`
 *          needs: it runs the query once per caller through the current testing app's pipeline with the cache step
 *          off, and fails when two callers it answers get different answers, because one scope-wide entry would then
 *          serve one caller's answer to another.
 * Boundary: test only. Every other step runs as in `run(...)`; a caller the query refuses (permission, entitlement)
 *           is skipped, since a refused call never reaches the cache. The callers must share one tenant, and at
 *           least two must get an answer.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 31, as amended 2026-10-28: `expectScopeCacheSafe`); ADR 0269 (testing helpers).
 */
import { isDeepStrictEqual } from "node:util";

import { Cache } from "@stackra/cache/contracts";
import type { AnyClass } from "@stackra/container";
import { isRefusal } from "@stackra/errors";

import { ActionPipeline, type CallInput, type Query } from "#core/index";
import { CURRENT_PIPELINE } from "#testing/constants/current-pipeline.constant";
import type { ScopeCacheSafeOptions } from "#testing/types/scope-cache-safe-options.type";

/**
 * Fails unless every caller in `options.as` that `type` answers gets the same answer for `input`.
 *
 * @throws TypeError for fewer than two callers or callers of different tenants; Error before any testing app compiled,
 * when fewer than two callers get an answer, or when two answers differ; any non-refusal error the query throws.
 * @example
 * await expectScopeCacheSafe(GetPriceListQuery, { listId }, { as: [actors.owner(), actors.cashier()], scope });
 */
export async function expectScopeCacheSafe<C extends AnyClass<Query>>(
  type: C,
  input: CallInput<InstanceType<C>>,
  options: ScopeCacheSafeOptions,
): Promise<void> {
  const current = CURRENT_PIPELINE.value;
  if (current === undefined)
    throw new Error(
      "No testing app: compile one with createTestingModule(Root).compile() before calling expectScopeCacheSafe()",
    );
  const { as: callers, ...request } = options;
  if (callers.length < 2)
    throw new TypeError("expectScopeCacheSafe compares two or more callers of one scope");
  if (new Set(callers.map((caller) => caller.scopeId)).size > 1)
    throw new TypeError("expectScopeCacheSafe compares callers of one tenant only");
  const { app } = current;
  const uncached = new ActionPipeline({
    has: (token) => token !== Cache && app.has(token),
    get: (token) => app.get(token),
  });
  const answers: { readonly caller: string; readonly output: unknown }[] = [];
  for (const actor of callers)
    try {
      answers.push({
        caller: actor.id,
        output: await uncached.execute(type, input, { ...request, actor }),
      });
    } catch (error) {
      if (!isRefusal(error)) throw error;
    }
  const [first, ...rest] = answers;
  if (first === undefined || rest.length === 0)
    throw new Error(
      `${type.name} answered fewer than two of the callers, so nothing shows its answer is the same for each`,
    );
  for (const answer of rest)
    if (!isDeepStrictEqual(answer.output, first.output))
      throw new Error(
        `${type.name} answers ${first.caller} and ${answer.caller} differently, so a scope-wide cache entry would ` +
          "serve one caller's answer to the other: keep cache.per CacheScope.Principal, or stop reading the caller",
      );
}
