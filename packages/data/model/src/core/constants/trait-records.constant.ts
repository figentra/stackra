/**
 * Stackra file contract:
 * Purpose: `TRAIT_RECORDS`, the trait registry: which trait produced each class that `Model.with` composed, so
 *          `traitsOf` can list the traits of a model for gen and @stackra/database.
 * Boundary: a WeakMap keyed by the class a trait returned; written by the trait `createTrait` made, read by
 *           `traitsOf`. Nothing is stored on a model instance (ADR 0294 decision 27). Internal: not exported from the
 *           entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (consequence: @stackra/model owns the trait registry); ADR 0294 (decision 27).
 */
import type { TraitRecord } from "#core/types/trait-record.type";

/** The class a trait returned, to that trait's record. */
export const TRAIT_RECORDS = new WeakMap<object, TraitRecord>();
