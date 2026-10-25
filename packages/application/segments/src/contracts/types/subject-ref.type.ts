/**
 * Stackra file contract:
 * Purpose: `SubjectRef`, the record a membership names: the key of its model and its public id (a user, a customer, a
 *          contact, a company).
 * Boundary: a type only. The package names no subject model: the key is whatever a consumer registered with
 *           `registerSegmentSubjects` (`commerce.customer`).
 * Runtime: isomorphic
 * Governing contract: ADR 0332 (decisions 1 and 3); ADR 0135 (public ids).
 */

/**
 * One subject record.
 *
 * @example
 * const subject: SubjectRef = { model: "commerce.customer", id: customer.id };
 */
export interface SubjectRef {
  /** The subject model's key, `<module>.<model>` (`commerce.customer`). */
  readonly model: string;

  /** The record's public id. */
  readonly id: string;
}
