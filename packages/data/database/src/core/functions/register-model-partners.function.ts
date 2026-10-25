/**
 * Stackra file contract:
 * Purpose: `registerModelPartners`, how generated code tells the database which model a `CrudService<M>` subclass or
 *          a `Factory<M>` subclass is typed against, since the type argument is gone at run time.
 * Boundary: called by generated code: the service pairs from the runtime wiring, the factory pairs from the generated
 *           testing setup only (so a server never loads a factory). A later pair for the same class replaces it.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 5: partners by type argument); ADR 0294 (decision 25).
 */
import type { AnyClass } from "@stackra/container";

import { MODEL_PARTNERS } from "#core/constants/model-partners.constant";

/**
 * Registers `[partner, model]` pairs.
 *
 * @example
 * registerModelPartners([
 *   [OrderService, Order],
 *   [ProductService, Product],
 * ]);
 */
export function registerModelPartners(
  pairs: readonly (readonly [partner: AnyClass, model: AnyClass])[],
): void {
  for (const [partner, model] of pairs) MODEL_PARTNERS.set(partner, model);
}
