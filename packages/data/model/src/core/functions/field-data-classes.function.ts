/**
 * Stackra file contract:
 * Purpose: `fieldDataClasses`, the one effective data class of each classified field of a model or shape: its
 *          `@Classify` class, its `@Classified` built-in class, or, when it carries both, the stricter code of the two
 *          on every effect under the `@Classify` key. Encryption checks, erasure, retention and masking read this, so
 *          a field's handling never depends on which of the two decorators it was given.
 * Boundary: pure over decorator metadata (`Classify.members`, `Classified.members`, both with ancestors) and
 *           `builtInDataClass`; a field with neither is absent. Merging never loosens either class; gen refuses the
 *           pair when the `@Classify` class is looser (`data_class_looser_than_classified`), so the merge only guards
 *           a member gen has not checked.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 4: one effective class per field); ADR 0341 (decision 4).
 */
import { strictestEffects } from "@stackra/contracts";
import type { DataClassEffects } from "@stackra/contracts";
import type { AnyClass } from "@stackra/container";
import { Classified } from "@stackra/validation";

import { Classify } from "#core/decorators/classify.decorator";
import { builtInDataClass } from "#core/functions/built-in-data-class.function";
import type { DataClassOptions } from "#core/types/data-class-options.type";

/**
 * Each classified field of `type` and its effective data class.
 *
 * @example
 * fieldDataClasses(Patient).get("diagnosis")?.encrypt; // "sealed" for a @Classified(DataClassification.Health) field
 */
export function fieldDataClasses(type: AnyClass): ReadonlyMap<string | symbol, DataClassOptions> {
  const declared = Classify.members(type);
  const builtIn = Classified.members(type);
  const found = new Map<string | symbol, DataClassOptions>();
  for (const field of new Set([...declared.keys(), ...builtIn.keys()])) {
    const own = declared.get(field)?.dataClass;
    const code = builtIn.get(field);
    const floor = code === undefined ? undefined : builtInDataClass(code);
    if (own !== undefined && floor !== undefined)
      found.set(
        field,
        Object.freeze({
          ...strictestEffects(
            own as unknown as DataClassEffects,
            floor as unknown as DataClassEffects,
          ),
          key: own.key,
        }) as DataClassOptions,
      );
    else if (own !== undefined) found.set(field, own);
    else if (floor !== undefined) found.set(field, floor);
  }
  return found;
}
