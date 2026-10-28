/**
 * Stackra file contract:
 * Purpose: `unsealedShredFields`, the check behind "a shredded field must be subject-sealed": every field a
 *          `PersonalData` declaration erases with `ErasureMethod.Shred` must be a `HasEncryptedFields({ subject })`
 *          field of its model, keyed by the same subject property, or destroying the subject's salt leaves it readable
 *          and the erasure receipt would be false.
 * Boundary: pure over a resolved declaration and the model's trait registry (`encryptedFieldsOf`,
 *           `encryptedSubjectOf`). `EraseSubjectWorkflow` refuses to erase while any field fails it; gen is to run the
 *           same rule at build time once it reads `PersonalData` (stackra-314).
 * Runtime: node
 * Governing contract: ADR 0189 (decision 2); ADR 0212 (crypto-shredding); gap gov2 (stackra-263).
 */
import { encryptedFieldsOf, encryptedSubjectOf } from "@stackra/model";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import type { PersonalDataDeclaration } from "#core/types/personal-data-declaration.type";

/**
 * The shredded fields of `declaration` that are not sealed under its subject's key.
 *
 * @returns `<kind>.<field>` for each such field, in declaration order; empty when every shredded field is sealed.
 * @example
 * unsealedShredFields({ kind: "crm.customer", model: Customer, subject: "userId", fields: { email: ErasureMethod.Shred } });
 * // ["crm.customer.email"] when Customer is HasEncryptedFields("email") without { subject: "userId" }
 */
export function unsealedShredFields(declaration: PersonalDataDeclaration): string[] {
  const { kind, model, subject, fields } = declaration;
  const sealed = encryptedSubjectOf(model) === subject ? encryptedFieldsOf(model) : [];
  return Object.entries(fields)
    .filter(([field, method]) => method === ErasureMethod.Shred && !sealed.includes(field))
    .map(([field]) => `${kind}.${field}`);
}
