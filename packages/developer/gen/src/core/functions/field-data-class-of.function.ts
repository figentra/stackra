/**
 * Stackra file contract:
 * Purpose: `fieldDataClassOf`, a model field's effective data class as gen reads it from source: its `@Classify`
 *          class's constant effects, its `@Classified` code's row of `DATA_CLASSIFICATION_EFFECTS`, or, when it carries
 *          both, the stricter code of the two on every effect under the `@Classify` key. The same rule as
 *          @stackra/model's `fieldDataClasses`, over the IR instead of decorator metadata.
 * Boundary: pure, over the IR. A `@Classify` class whose effects gen cannot read in full (a package's class read from
 *           its declarations, or one missing an effect) counts only through its `@Classified` code;
 *           `checkDataClasses` refuses a readable class that leaves an effect out.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decisions 2 and 4); ADR 0341 (decision 4).
 */
import {
  DATA_CLASS_EFFECT_RANKS,
  DATA_CLASSIFICATION_EFFECTS,
  strictestEffects,
} from "@stackra/contracts";
import type { DataClassEffects } from "@stackra/contracts";

import { classifyOptionsOf } from "#core/functions/classify-options-of.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { FieldDataClass } from "#core/types/field-data-class.type";
import type { FieldIR } from "#core/types/field-ir.type";

/**
 * The effective data class of `field` on `declared`; undefined for an unclassified field.
 *
 * @example
 * fieldDataClassOf(patient, { name: "diagnosis", classified: "health", ... })?.effects.encrypt; // "sealed"
 */
export function fieldDataClassOf(
  declared: DeclaredClass,
  field: FieldIR,
): FieldDataClass | undefined {
  const own = classifyOptionsOf(declared, field.name);
  const readable =
    own !== undefined &&
    Object.entries(DATA_CLASS_EFFECT_RANKS).every(
      ([effect, ranks]) =>
        typeof own[effect] === "string" && Object.hasOwn(ranks, own[effect] as string),
    )
      ? own
      : undefined;
  const code = field.classified;
  const floor =
    code !== undefined && Object.hasOwn(DATA_CLASSIFICATION_EFFECTS, code)
      ? DATA_CLASSIFICATION_EFFECTS[code as keyof typeof DATA_CLASSIFICATION_EFFECTS]
      : undefined;
  if (readable !== undefined) {
    const effects = Object.fromEntries(
      Object.keys(DATA_CLASS_EFFECT_RANKS).map((effect) => [effect, readable[effect]]),
    ) as unknown as DataClassEffects;
    return {
      key: String(readable["key"]),
      effects: floor === undefined ? effects : strictestEffects(effects, floor),
    };
  }
  return floor === undefined || code === undefined ? undefined : { key: code, effects: floor };
}
