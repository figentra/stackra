/**
 * Stackra file contract:
 * Purpose: `PersonalDataOptions`, what `PersonalData({...})` takes: the model whose rows hold a subject's personal
 *          data, the field that names the subject, and, optionally, each personal field with its erasure method.
 * Boundary: a type only; `PersonalData` checks it when the class is defined. The model is a thunk so a declaration
 *           never forces the model's module to load first. Field names are the model's property names. Without
 *           `fields`, the declaration's fields are derived from the model's data classes: every field whose class
 *           erases (`erasure` other than `keep`), with that method (ADR 0540 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decisions 1 and 2); ADR 0294 (decision 25: kind options); ADR 0540 (decision 5);
 *                     STA-1375.
 */
import type { AnyClass } from "@stackra/container";

import type { ErasureMethod } from "#contracts/enums/erasure-method.enum";

/** One model's personal data. */
export interface PersonalDataOptions {
  /** The model whose rows are the subject's (`() => Customer`). */
  readonly model: () => AnyClass;

  /** The property holding the subject's public id (`userId`, or `id` for the subject's own row). */
  readonly subject: string;

  /**
   * Each personal field and how erasure disposes of it, at least one when given. Left out, the fields are the
   * model's classified fields whose data class erases, each with its class's method. A listed method never goes
   * below its field's class (`looserErasureFields`).
   */
  readonly fields?: Readonly<Record<string, ErasureMethod>> | undefined;
}
