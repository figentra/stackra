/**
 * Stackra file contract:
 * Purpose: `PLATFORM_PARTNERS`, the platform `CrudService<M>` classes gen binds from `PLATFORM_BINDINGS` and the model
 *          each is typed against, so the host's registrations write `registerModelPartners` for one it injects:
 *          `RuleSetService` over `RuleSet` (the `@stackra/rules` node a notifications or scheduling service reads its
 *          rule sets through).
 * Boundary: a frozen map keyed by `<package>#<Class>` like `PLATFORM_BINDINGS`; a key here has a row there. Registering
 *           a pair the package's own registrations also write changes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 5: partners by type argument); ADR 0263 (gen writes the wiring); ADR 0331
 *                     (decisions 5 and 6: `RuleSetService`).
 */
import type { ClassRef } from "#core/types/class-ref.type";

/** `<package>#<Class>` of a platform CrudService to its model. */
export const PLATFORM_PARTNERS: Readonly<Record<string, ClassRef>> = Object.freeze({
  "@stackra/rules#RuleSetService": { name: "RuleSet", from: "@stackra/rules/node" },
});
