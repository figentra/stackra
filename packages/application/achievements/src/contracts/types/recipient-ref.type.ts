/**
 * Stackra file contract:
 * Purpose: `RecipientRef`, the record an award is granted to: the key of its model and its public id (a member, an
 *          athlete, a student, a customer).
 * Boundary: a type only. The package names no recipient model: the key is whatever a consumer registered with
 *           `registerAwardRecipients` (`workforce.member`).
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decision 1); ADR 0135 (public ids).
 */

/**
 * One recipient record.
 *
 * @example
 * const recipient: RecipientRef = { model: "workforce.member", id: member.id };
 */
export interface RecipientRef {
  /** The recipient model's key, `<module>.<model>` (`workforce.member`). */
  readonly model: string;

  /** The record's public id. */
  readonly id: string;
}
