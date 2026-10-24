/**
 * Stackra file contract:
 * Purpose: `modelOf`, the model a partner class is typed against: its own registered pair, or its nearest ancestor's
 *          (a host override of a service keeps its base's model).
 * Boundary: internal; reads `MODEL_PARTNERS` only.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 5: partners by type argument); ADR 0306 (overrides extend their base).
 */
import type { AnyClass } from "@stackra/container";

import { MODEL_PARTNERS } from "#core/constants/model-partners.constant";

/**
 * The model of `partner`.
 *
 * @throws TypeError when neither the class nor an ancestor has a registered model.
 * @example
 * modelOf(OrderService); // Order
 */
export function modelOf<M extends object>(partner: object): AnyClass<M> {
  for (
    let current: object | null = partner;
    current !== null && current !== Function.prototype;
    current = Object.getPrototypeOf(current) as object | null
  ) {
    const model = MODEL_PARTNERS.get(current);
    if (model !== undefined) return model as AnyClass<M>;
  }
  const name = (partner as { readonly name?: string }).name ?? String(partner);
  throw new TypeError(
    `No model is registered for ${name}: gen registers its type argument with registerModelPartners`,
  );
}
