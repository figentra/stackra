/**
 * Stackra file contract:
 * Purpose: `FactSubject`, the record a `FactProvider` computes facts about: a registered model key and the record's
 *          public id (`{ model: "commerce.customer", id: "cus_…" }`).
 * Boundary: a type only, and structural: an add-on's own subject reference (`SubjectRef` of @stackra/segments) has the
 *           same shape, so the engine names no add-on and imports none (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 4); ADR 0462 (decision 1).
 */

/**
 * The subject of a fact provider's facts.
 *
 * @example
 * const subject: FactSubject = { model: "commerce.customer", id: customer.id };
 */
export interface FactSubject {
  /** The subject model's key, `<module>.<model>`. */
  readonly model: string;

  /** The record's public id. */
  readonly id: string;
}
