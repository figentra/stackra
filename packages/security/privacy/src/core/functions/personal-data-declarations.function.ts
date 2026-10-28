/**
 * Stackra file contract:
 * Purpose: `personalDataDeclarations`, the registered declarations resolved for use: each model thunk called, its model key
 *          (`<module>.<model>`) derived, the subject property and fields copied.
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
  return [...PERSONAL_DATA_CLASSES].map(([type, module]) => {
    const options = kindOf(type)?.options as unknown as PersonalDataOptions;
    const model: AnyClass = options.model();
    // shortcut: derived from the class name as gen derives it, until gen exposes the locked model keys (STA-339).
    const kind = `${module}.${model.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()}`;
    return { kind, model, subject: options.subject, fields: options.fields };
  });
}
