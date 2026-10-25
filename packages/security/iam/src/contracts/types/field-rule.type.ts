/**
 * Stackra file contract:
 * Purpose: `FieldRule`, a field-level rule: for one model, the fields an audience may not read or may not write,
 *          optionally only on records a `@stackra/rules` condition matches.
 * Boundary: a type only, and a scope's data referencing registered fields (the condition is checked against the
 *           record's fact source). It narrows a permission the principal already holds; it never grants one.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 3); ADR 0331 (decision 11); STA-595 (field-level enforcement).
 */
import type { Condition } from "@stackra/rules";

import type { FieldAccess } from "#contracts/enums/field-access.enum";
import type { Audience } from "#contracts/types/audience.type";

/**
 * A field rule.
 *
 * @example
 * const medical: FieldRule = { model: "academy.athlete", fields: ["medical_notes"], access: FieldAccess.Hidden, audience: coaches };
 */
export interface FieldRule {
  /** The model's key (`academy.athlete`). */
  readonly model: string;

  /** The attribute names the rule covers (`medical_notes`). */
  readonly fields: readonly string[];

  /** Hidden or read-only. */
  readonly access: FieldAccess;

  /** Who it applies to; absent for every principal. */
  readonly audience?: Audience;

  /** Applies only to records this condition matches; absent for every record. */
  readonly condition?: Condition;
}
