/**
 * Stackra file contract:
 * Purpose: `PersonalDataOptions`, what `PersonalData({...})` takes: the model whose rows hold a subject's personal
 *          data, the field that names the subject, and each personal field with its erasure method.
 * Boundary: a type only; `PersonalData` checks it when the class is defined. The model is a thunk so a declaration
 *           never forces the model's module to load first. Field names are the model's property names.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decisions 1 and 2); ADR 0294 (decision 25: kind options); STA-1375.
 */
import type { AnyClass } from "@stackra/container";

import type { ErasureMethod } from "#contracts/enums/erasure-method.enum";

/** One model's personal data. */
export interface PersonalDataOptions {
  /** The model whose rows are the subject's (`() => Customer`). */
  readonly model: () => AnyClass;

  /** The property holding the subject's public id (`userId`, or `id` for the subject's own row). */
  readonly subject: string;

  /** Each personal field and how erasure disposes of it; at least one. */
  readonly fields: Readonly<Record<string, ErasureMethod>>;
}
