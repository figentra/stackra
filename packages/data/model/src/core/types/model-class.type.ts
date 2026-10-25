/**
 * Stackra file contract:
 * Purpose: `ModelClass<I>`, a concrete model class whose instances are `I`: what `Model.with` returns, what a trait
 *          takes and returns, and what the ORM's `EntitySchema` accepts as `class`.
 * Boundary: a type only. The constructor takes `any[]` because TypeScript requires it of a class a mixin extends and
 *           MikroORM's `EntityCtor` uses the same shape; models are still never built with `new` (ADR 0294
 *           decision 27).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 25 and 27); the STA-335 entity-schema spike.
 */
import type { Model } from "#core/bases/model.base";

/**
 * A model class of instances `I`.
 *
 * @example
 * const Base: ModelClass<Model & { id: PublicId<"ord"> }> = Model.with(HasPublicId("ord"));
 */
// oxlint-disable-next-line typescript/no-explicit-any -- reason: a class a mixin extends must take `...args: any[]` (TS2545)
export type ModelClass<I extends object = Model> = new (...args: any[]) => I;
