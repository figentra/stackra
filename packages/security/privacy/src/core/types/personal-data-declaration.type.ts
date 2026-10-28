/**
 * Stackra file contract:
 * Purpose: `PersonalDataDeclaration`, one registered declaration as the export and the erasure read it: the model
 *          (resolved from its thunk), its model key, the subject property and the fields with their methods.
 * Boundary: a type only; `personalDataDeclarations` builds it from the kind registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0189; STA-1375.
 */
import type { AnyClass } from "@stackra/container";

import type { ErasureMethod } from "#contracts/enums/erasure-method.enum";

/** A resolved declaration. */
export interface PersonalDataDeclaration {
  /** The model key (`crm.customer`), the `kind` of its export section and receipt lines. */
  readonly kind: string;

  /** The model class. */
  readonly model: AnyClass;

  /** The property naming the subject. */
  readonly subject: string;

  /** Each personal field and its method. */
  readonly fields: Readonly<Record<string, ErasureMethod>>;
}
