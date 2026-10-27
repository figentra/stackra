/**
 * Stackra file contract:
 * Purpose: `personalDataDeclarations`, the registered declarations resolved for use: each model thunk called, its kind
 *          name taken, the subject property and fields copied.
 * Boundary: reads the kind registry through `kindOf`; resolves thunks on every call, so a model loaded late is found.
 * Runtime: isomorphic
 * Governing contract: ADR 0189; STA-1375.
 */
import type { AnyClass } from "@stackra/container";
import { kindOf } from "@stackra/container";

import type { PersonalDataOptions } from "#contracts/types/personal-data-options.type";
import { PERSONAL_DATA_CLASSES } from "#core/constants/personal-data-classes.constant";
import type { PersonalDataDeclaration } from "#core/types/personal-data-declaration.type";

/**
 * Every registered declaration, in registration order.
 *
 * @example
 * for (const { model, subject, fields } of personalDataDeclarations()) await store.find(model, subject, id, Object.keys(fields));
 */
export function personalDataDeclarations(): PersonalDataDeclaration[] {
  return [...PERSONAL_DATA_CLASSES].map((type) => {
    const options = kindOf(type)?.options as unknown as PersonalDataOptions;
    const model: AnyClass = options.model();
    // shortcut: the model's class name stands in for its locked model key until gen exposes keys (STA-339).
    return { kind: model.name, model, subject: options.subject, fields: options.fields };
  });
}
