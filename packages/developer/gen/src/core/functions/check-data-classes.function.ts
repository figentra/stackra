/**
 * Stackra file contract:
 * Purpose: `checkDataClasses`, the gen checks that keep a model's classified fields to one classification source: a
 *          `@Classify` class that leaves an effect out or names an unknown code (`data_class_effects_missing`), a
 *          `@Classify` class looser than the `@Classified` class the same field carries
 *          (`data_class_looser_than_classified`), and a model holding a field whose class needs a bounded retention but
 *          declaring no `Retention` (`classified_model_without_retention`).
 * Boundary: pure, over the IR: the member's own models and their shapes. The encryption effect is checked by
 *           `checkEncryptedFields` and the erasure effect by `checkPersonalData`, both through `fieldDataClassOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decisions 1, 3 and 4); ADR 0341 (Enforcement: a class missing an effect fails); ADR
 *                     0134 (decision 3: `Retention`).
 */
import {
  DATA_CLASS_EFFECT_RANKS,
  DATA_CLASSIFICATION_EFFECTS,
  loosenedEffects,
} from "@stackra/contracts";

import { classifyOptionsOf } from "#core/functions/classify-options-of.function";
import { fieldDataClassOf } from "#core/functions/field-data-class-of.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The refusals of the data-class checks.
 *
 * @example
 * checkDataClasses(ir).map((error) => error.code); // ["classified_model_without_retention"]
 */
export function checkDataClasses(ir: MemberIR): GenError[] {
  const errors: GenError[] = [];
  for (const declared of ir.classes) {
    if (declared.kind !== "model") continue;
    const shape = ir.shapes.find(
      (candidate) => candidate.name === declared.name && candidate.file === declared.file,
    );
    if (shape === undefined) continue;
    const bounded: string[] = [];
    for (const field of shape.fields) {
      const at = {
        file: declared.file,
        line: 0,
        column: 0,
        subject: `${declared.name}.${field.name}`,
      };
      const own = classifyOptionsOf(declared, field.name);
      if (own !== undefined) {
        const missing = Object.entries(DATA_CLASS_EFFECT_RANKS)
          .filter(
            ([effect, ranks]) =>
              typeof own[effect] !== "string" || !Object.hasOwn(ranks, own[effect] as string),
          )
          .map(([effect]) => effect);
        if (missing.length > 0)
          errors.push({
            ...at,
            code: "data_class_effects_missing",
            message: `the data class "${String(own["key"])}" on ${declared.name}.${field.name} sets no valid ${missing.join(", ")}, so the readers of those effects cannot apply it`,
            fix: `give the DataClass({ ... }) of "${String(own["key"])}" every effect: ${Object.keys(DATA_CLASS_EFFECT_RANKS).join(", ")}`,
          });
        else if (
          field.classified !== undefined &&
          Object.hasOwn(DATA_CLASSIFICATION_EFFECTS, field.classified)
        ) {
          const floor =
            DATA_CLASSIFICATION_EFFECTS[
              field.classified as keyof typeof DATA_CLASSIFICATION_EFFECTS
            ];
          const looser = loosenedEffects(own, floor);
          if (looser.length > 0)
            errors.push({
              ...at,
              code: "data_class_looser_than_classified",
              message: `${declared.name}.${field.name} is @Classify "${String(own["key"])}" and @Classified "${field.classified}", but "${String(own["key"])}" is looser on ${looser.map((effect) => `${effect} (${String(own[effect])} below ${floor[effect]})`).join(", ")}`,
              fix: `tighten "${String(own["key"])}" to at least the ${field.classified} row on those effects, or classify the field with one decorator`,
            });
        }
      }
      if (fieldDataClassOf(declared, field)?.effects.retention === "required")
        bounded.push(field.name);
    }
    if (bounded.length > 0 && !declared.traits.some((trait) => trait.name === "Retention"))
      errors.push({
        code: "classified_model_without_retention",
        file: declared.file,
        line: 0,
        column: 0,
        subject: declared.name,
        message: `${declared.name} holds ${bounded.join(", ")}, whose data class needs a bounded retention, but declares no Retention, so its rows would be kept forever`,
        fix: `add Retention({ keep, basis, policy }) to ${declared.name}'s Model.with(...)`,
      });
  }
  return errors;
}
