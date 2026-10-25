/**
 * Stackra file contract:
 * Purpose: `contributionsOf(type, input)`, the testing parts' share of one route run, merged: the registered parts in
 *          registration order, then the call's `services`, then the input's own members for every name no part
 *          claimed. The first part that builds the instance wins; a later part wins a member both supply.
 * Boundary: internal to `./testing` (not exported). Synchronous when every part is, so `renderRoute` can hand the fakes
 *           back at once; a promise when any part answers asynchronously.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { AnyClass } from "@stackra/container";

import { ROUTE_TESTING_PARTS } from "#testing/constants/route-testing-parts.constant";
import type { RouteLoaderInput } from "#testing/types/route-loader-input.type";
import type { RouteTestingContribution } from "#testing/types/route-testing-contribution.type";

/** The input names that configure the run; every other input member is a context member. */
const OPTIONS = new Set([
  "url",
  "path",
  "search",
  "params",
  "locale",
  "layoutData",
  "container",
  "services",
]);

/**
 * The merged contribution of every part to one run of `type`.
 *
 * @example
 * const { instance, context } = await contributionsOf(TabsLayout, { session });
 */
export function contributionsOf(
  type: AnyClass,
  input: RouteLoaderInput,
): RouteTestingContribution | Promise<RouteTestingContribution> {
  const parts = [...ROUTE_TESTING_PARTS.values(), ...(input.services ?? [])];
  const answers = parts.map((part) => part({ type, input }));
  const merge = (list: readonly RouteTestingContribution[]): RouteTestingContribution => {
    const context: Record<string, unknown> = {};
    let instance: object | undefined;
    for (const answer of list) {
      instance ??= answer.instance;
      Object.assign(context, answer.context);
    }
    for (const [member, value] of Object.entries(input))
      if (!OPTIONS.has(member) && !Object.hasOwn(context, member)) context[member] = value;
    return instance === undefined ? { context } : { instance, context };
  };
  return answers.some((answer) => answer instanceof Promise)
    ? Promise.all(answers).then(merge)
    : merge(answers as RouteTestingContribution[]);
}
