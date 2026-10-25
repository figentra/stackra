/**
 * Stackra file contract:
 * Purpose: `repositoryOf(Model)`, the class token of `Repository<Model>`: a class that injects `Repository<Variant>`
 *          has the dependency `repositoryOf(Variant)` in the generated wiring.
 * Boundary: one token per model, made on first use and reused, because classes are the only DI tokens. The token is a
 *           `CrudService<Model>` subclass with its model registered and no dependencies, so the container builds it
 *           like any binding; the injecting class sees only the `Repository` surface.
 * Runtime: node
 * Governing contract: ADR 0145 and ADR 0263 as amended by ADR 0294 (classes are the only tokens); ADR 0097.
 */
import type { AnyClass } from "@stackra/container";

import { CrudService } from "#core/bases/crud-service.base";
import { MODEL_PARTNERS } from "#core/constants/model-partners.constant";
import type { Repository } from "#core/types/repository.type";

/** The token made for each model. */
const TOKENS = new WeakMap<object, AnyClass>();

/**
 * The repository token of `model`.
 *
 * @example
 * { provide: GetVariantByBarcodeQuery, deps: [repositoryOf(Variant)] }
 */
export function repositoryOf<M extends object>(model: AnyClass<M>): AnyClass<Repository<M>> {
  const known = TOKENS.get(model);
  if (known !== undefined) return known as AnyClass<Repository<M>>;
  const token = class extends CrudService<M> {};
  Object.defineProperty(token, "name", { value: `${model.name}Repository` });
  MODEL_PARTNERS.set(token, model);
  TOKENS.set(model, token);
  return token;
}
