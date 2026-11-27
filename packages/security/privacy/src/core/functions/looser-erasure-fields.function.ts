/**
 * Stackra file contract:
 * Purpose: `looserErasureFields`, the fields a `PersonalData` declaration erases more weakly than their data class
 *          says (an `anonymise` on a field whose class deletes or shreds it), so one source decides how far erasure
 *          goes and a declaration can only go further.
 * Boundary: pure over a resolved declaration, `fieldDataClasses` and @stackra/contracts' effect ranks. A field with no
 *           class is free to take any method. `EraseSubjectWorkflow` refuses to erase while any field fails it; gen
 *           refuses the declaration at build time (`personal_data_looser_than_class`).
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decisions 3 and 5); ADR 0189 (decision 2).
 */
import { DATA_CLASS_EFFECT_RANKS } from "@stackra/contracts";
import { fieldDataClasses } from "@stackra/model";

import type { PersonalDataDeclaration } from "#core/types/personal-data-declaration.type";

/** The erasure ranks, by code. */
const RANKS: Readonly<Record<string, number>> = DATA_CLASS_EFFECT_RANKS.erasure;

/**
 * The fields of `declaration` whose method ranks below their data class's erasure.
 *
 * @returns `<kind>.<field> (<method> below <class erasure>)` for each, in declaration order; empty when none.
 * @example
 * looserErasureFields({ kind: "clinic.note", model: Note, subject: "patientId", fields: { body: "anonymise" } });
 * // ["clinic.note.body (anonymise below shred)"] when body's class shreds
 */
export function looserErasureFields(declaration: PersonalDataDeclaration): string[] {
  const { kind, model, fields } = declaration;
  const classes = fieldDataClasses(model);
  const looser: string[] = [];
  for (const [field, method] of Object.entries(fields)) {
    const floor = classes.get(field)?.erasure;
    if (floor !== undefined && (RANKS[method] ?? 0) < (RANKS[floor] ?? 0))
      looser.push(`${kind}.${field} (${method} below ${floor})`);
  }
  return looser;
}
