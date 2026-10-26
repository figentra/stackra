/**
 * Stackra file contract:
 * Purpose: `ProjectionClass<S>`, the class `Projection<Source>({ key })` returns: extended by a module's read model and
 *          built by the container.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 16); ADR 0305 (rule 5).
 */
import type { ProjectionBase } from "#core/bases/projection.base";

/** A projection class over rows of `S`. */
export type ProjectionClass<S extends object = object> = new () => ProjectionBase<S>;
