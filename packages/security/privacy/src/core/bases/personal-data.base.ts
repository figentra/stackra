/**
 * Stackra file contract:
 * Purpose: `PersonalData({ model, subject, fields })`, the kind base a module declares its personal data with: which
 *          model holds a subject's rows, which property names the subject, and each personal field with how erasure
 *          disposes of it, or no fields, so they are derived from the model's data classes. One
 *          `<model>.personal-data.ts` per model, in the module's `privacy/` group.
 * Boundary: called only. The call checks and records its options in the kind registry; `personalDataDeclarations`
 *           reads them through `kindOf`. A declaration holds no code: the DSAR export and the erasure saga do the
 *           work through `PersonalDataStore`, so a module states data, never an exporter or an eraser (configuration,
 *           not code). The interface of the same name is its instance side.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decisions 1 and 2); ADR 0294 (decisions 16 and 25); ADR 0305 (rules 2 and 3);
 *                     ADR 0540 (decision 5: fields derived when left out); STA-1375.
 */
import { createKind } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import type { PersonalDataOptions } from "#contracts/types/personal-data-options.type";
import type { PersonalDataClass } from "#core/types/personal-data-class.type";

/** The instance side of every personal-data declaration. */
export interface PersonalData {
  /** Type-only kind brand, so a class of another kind cannot stand in for a declaration. */
  readonly "~kind": "personal_data";
}

/**
 * Checks `options`: a model thunk, a non-empty subject property, and, when `fields` is given, at least one field, each
 * with a known method.
 *
 * @throws TypeError when the model is not a thunk, the subject is empty, or `fields` is given empty.
 * @throws RangeError when a field's method is not an `ErasureMethod`.
 */
function readPersonalDataOptions(options: PersonalDataOptions): Readonly<Record<string, unknown>> {
  const { model, subject, fields } = options ?? ({} as Partial<PersonalDataOptions>);
  if (typeof model !== "function")
    throw new TypeError("PersonalData({ model }) is a thunk of the model: model: () => Customer");
  if (typeof subject !== "string" || subject === "")
    throw new TypeError("PersonalData({ subject }) names the property holding the subject's id");
  // Left out, the fields are the model's classified fields whose data class erases (ADR 0540 decision 5).
  if (fields === undefined) return { model, subject };
  const entries = Object.entries(fields);
  if (entries.length === 0)
    throw new TypeError(
      "PersonalData({ fields }) lists at least one personal field, or leaves fields out so the model's data classes give them",
    );
  for (const [field, method] of entries)
    if (!Enum.values(ErasureMethod).includes(method))
      throw new RangeError(
        `PersonalData field ${field} needs a method from ErasureMethod, got ${JSON.stringify(method)}`,
      );
  return { model, subject, fields: Object.freeze({ ...fields }) };
}

/**
 * The personal-data kind base.
 *
 * @example
 * export class CustomerPersonalData extends PersonalData({
 *   model: () => Customer,
 *   subject: "userId",
 *   fields: { name: ErasureMethod.Shred, email: ErasureMethod.Shred, phone: ErasureMethod.Anonymise },
 * }) {}
 * // or, every field the model's data classes erase, with their methods:
 * export class PatientPersonalData extends PersonalData({ model: () => Patient, subject: "id" }) {}
 */
export const PersonalData = createKind(
  "personal_data",
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; a declaration holds no state
  class PersonalDataBase {},
  readPersonalDataOptions,
) as (options: PersonalDataOptions) => PersonalDataClass;
