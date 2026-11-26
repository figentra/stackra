/**
 * Stackra file contract:
 * Purpose: `checkPersonalData`, the gen checks of a `PersonalData` declaration against its model and the model's data
 *          classes, at build time instead of on the first erasure: a listed field the model does not declare
 *          (`personal_data_field_unknown`), a credential field (`personal_data_credential_field`: a provider secret
 *          goes with its record, never with a subject, ADR 0494), a method weaker than the field's data class
 *          (`personal_data_looser_than_class`), a shredded field not sealed under the declaration's subject key
 *          (`personal_data_shred_unsealed`, the rule `unsealedShredFields` applies at runtime), and an anonymised
 *          field that cannot hold null (`personal_data_anonymise_not_nullable`: erasure writes null).
 * Boundary: pure, over the IR: declarations of the member's own models only (a package's model is checked by its own
 *           gen). A declaration that lists no fields is checked on the fields its model's classes derive (every
 *           classified field whose class erases, with that method), as @stackra/privacy derives them.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 5); ADR 0189 (decision 2); ADR 0494 (rule 4); data-layer gap gov2.
 */
import { DATA_CLASS_EFFECT_RANKS } from "@stackra/contracts";

import { fieldDataClassOf } from "#core/functions/field-data-class-of.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The erasure ranks, by code. */
const RANKS: Readonly<Record<string, number>> = DATA_CLASS_EFFECT_RANKS.erasure;

/**
 * The refusals of the personal-data checks.
 *
 * @example
 * checkPersonalData(ir).map((error) => error.code); // ["personal_data_shred_unsealed"]
 */
export function checkPersonalData(ir: MemberIR): GenError[] {
  const errors: GenError[] = [];
  for (const declaration of ir.classes) {
    if (declaration.kind !== "personal_data") continue;
    const target = declaration.options["model"] as { readonly $class?: unknown } | undefined;
    const subject = declaration.options["subject"];
    const model = ir.classes.find(
      (candidate) => candidate.kind === "model" && candidate.name === target?.$class,
    );
    const shape = ir.shapes.find(
      (candidate) => candidate.name === model?.name && candidate.file === model?.file,
    );
    if (model === undefined || shape === undefined || typeof subject !== "string") continue;
    const listed = declaration.options["fields"] as Readonly<Record<string, unknown>> | undefined;
    const fields: [string, string][] =
      listed === undefined
        ? shape.fields.flatMap((field) => {
            const erasure = fieldDataClassOf(model, field)?.effects.erasure;
            return erasure === undefined || erasure === "keep"
              ? []
              : [[field.name, erasure] as [string, string]];
          })
        : Object.entries(listed).map(([field, method]) => [field, String(method)]);
    const trait = model.traits.find((use) => use.name === "HasEncryptedFields");
    const keyed = trait?.args[0] as { readonly subject?: unknown } | undefined;
    const sealed =
      typeof keyed === "object" && keyed !== null && keyed.subject === subject
        ? new Set(trait?.args.filter((arg) => typeof arg === "string"))
        : new Set<unknown>();
    for (const [name, method] of fields) {
      const at = {
        file: declaration.file,
        line: 0,
        column: 0,
        subject: `${declaration.name}.${name}`,
      };
      const field = shape.fields.find((candidate) => candidate.name === name);
      if (field === undefined) {
        errors.push({
          ...at,
          code: "personal_data_field_unknown",
          message: `${declaration.name} erases ${name}, which ${model.name} does not declare`,
          fix: `declare \`${name}\` on ${model.name}, or remove it from ${declaration.name}'s fields`,
        });
        continue;
      }
      const dataClass = fieldDataClassOf(model, field);
      if (dataClass?.key === "credential" || field.classified === "credential") {
        errors.push({
          ...at,
          code: "personal_data_credential_field",
          message: `${declaration.name} names ${model.name}.${name}, a credential: a provider secret is never in a subject-access export or a subject's erasure, it goes with its owning record`,
          fix: `remove ${name} from ${declaration.name}'s fields`,
        });
        continue;
      }
      const floor = dataClass?.effects.erasure;
      if (floor !== undefined && (RANKS[method] ?? 0) < (RANKS[floor] ?? 0))
        errors.push({
          ...at,
          code: "personal_data_looser_than_class",
          message: `${declaration.name} erases ${model.name}.${name} with ${method}, weaker than its data class "${dataClass?.key}" (${floor}), so erasure would leave more than the class allows`,
          fix: `use ${floor} (or a stronger method) for ${name}, or leave fields out so the class gives it`,
        });
      if (method === "shred" && !sealed.has(name))
        errors.push({
          ...at,
          code: "personal_data_shred_unsealed",
          message: `${declaration.name} shreds ${model.name}.${name}, which is not sealed under the "${subject}" subject's key, so destroying the salt would leave it readable and the erasure receipt would be false`,
          fix: `name ${name} in HasEncryptedFields({ subject: "${subject}" }, ...) on ${model.name}, or erase it another way`,
        });
      if (method === "anonymise" && !field.nullable)
        errors.push({
          ...at,
          code: "personal_data_anonymise_not_nullable",
          message: `${declaration.name} anonymises ${model.name}.${name}, but its type has no \`| null\`, so erasure's null would be refused by the column`,
          fix: `type ${name} as \`| null\`, or erase it with delete or shred`,
        });
    }
  }
  return errors;
}
