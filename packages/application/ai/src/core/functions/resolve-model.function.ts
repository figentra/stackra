/**
 * Stackra file contract:
 * Purpose: `resolveModel(choice, drivers)`, the model instance of a routed choice from the bound provider drivers.
 * Boundary: pure apart from the driver's own call. A refused choice or a provider with no bound driver throws, so a
 *           call never reaches a model the route table did not choose.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 2); ADR 0360 (decision 14).
 */
import type { LanguageModel } from "ai";

import type { ModelProviderDriver } from "#core/types/model-provider-driver.type";
import type { RouteChoice } from "#core/types/route-choice.type";

/**
 * The model instance `choice` names.
 *
 * @throws RangeError when `choice` was refused or no driver is bound for its provider.
 * @example
 * const model = resolveModel(routeModel(request, table), drivers);
 * await decide({ model, prompt, yesNo: true });
 */
export function resolveModel(
  choice: RouteChoice,
  drivers: readonly ModelProviderDriver[],
): Exclude<LanguageModel, string> {
  if (choice.kind === "refused")
    throw new RangeError(`resolveModel: the call was refused by the router (${choice.reason})`);
  const driver = drivers.find((each) => each.provider === choice.route.provider);
  if (driver === undefined)
    throw new RangeError(`resolveModel: no driver is bound for "${choice.route.provider}"`);
  return driver.model(choice.route.model, choice.region);
}
