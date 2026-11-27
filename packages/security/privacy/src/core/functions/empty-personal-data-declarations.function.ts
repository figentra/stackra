/**
 * Stackra file contract:
 * Purpose: `emptyPersonalDataDeclarations`, the registered `PersonalData` declarations that resolve to no field: they
 *          list none and no data class of their model derives an erasing field (`PersonalData` refuses an empty list). Erasing a subject
 *          would touch nothing of such a model while the receipt reports the subject erased, so erasure fails closed
 *          on them (gen's `personal_data_no_fields` refuses the same declaration at build time).
 * Boundary: reads the kind registry through `kindOf` and the model's classes through `fieldDataClasses`, as
 *           `personalDataDeclarations` does; resolves thunks on every call. A declaration whose listed fields are all
 *           credentials is not empty here: it names its fields, and gen refuses the credentials
 *           (`personal_data_credential_field`).
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 5: erasure fails closed); ADR 0189 (decision 2).
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";
import { fieldDataClasses } from "@stackra/model";

import type { PersonalDataOptions } from "#contracts/types/personal-data-options.type";
import { PERSONAL_DATA_CLASSES } from "#core/constants/personal-data-classes.constant";

/**
 * The class names of the registered declarations that resolve to no field, in registration order; empty when none.
 *
 * @example
 * emptyPersonalDataDeclarations(); // ["AuditLinePersonalData"] when it lists no fields and AuditLine erases none
 */
export function emptyPersonalDataDeclarations(): string[] {
  const empty: string[] = [];
  for (const [type] of PERSONAL_DATA_CLASSES) {
    const options = kindOf(type)?.options as unknown as PersonalDataOptions;
    const model: AnyClass = options.model();
    const listed = options.fields === undefined ? [] : Object.keys(options.fields);
    const derived = [...fieldDataClasses(model)].filter(
      ([field, dataClass]) => typeof field === "string" && dataClass.erasure !== "keep",
    );
    if (listed.length === 0 && (options.fields !== undefined || derived.length === 0))
      empty.push(type.name);
  }
  return empty;
}
