/**
 * Stackra file contract:
 * Purpose: `MODEL_PARTNERS`, the model each partner class is typed against: `OrderService` (from
 *          `CrudService<Order>`), `OrderFactory` (from `Factory<Order>`), and each `repositoryOf(Order)` token.
 * Boundary: internal. A type argument does not exist at run time, so gen reads it from the heritage clause and
 *           registers the pair with `registerModelPartners`; `repositoryOf` registers its own tokens.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 5: the subject is the type argument); ADR 0105 as amended by ADR 0294.
 */
import type { AnyClass } from "@stackra/container";

/** Partner class to model class. */
export const MODEL_PARTNERS = new WeakMap<object, AnyClass>();
