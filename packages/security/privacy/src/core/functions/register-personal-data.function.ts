/**
 * Stackra file contract:
 * Purpose: `registerPersonalData`, which adds a module's declaration classes to the registry the DSAR export and the
 *          erasure saga walk. A module calls it once with its key and its declarations.
 * Boundary: refuses a module key that is not snake_case and a class that is not a `PersonalData` declaration;
 *           registering a class twice keeps one entry. The module key is what gen will derive from the `privacy/`
 *           group's folder; with the model's name it makes the receipt's model key (`crm.customer`).
 *           shortcut: called by hand until gen registers every `privacy/` group class (STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15 and 20); STA-1375.
 */
import { kindOf } from "@stackra/container";

import { PERSONAL_DATA_CLASSES } from "#core/constants/personal-data-classes.constant";
import type { PersonalDataClass } from "#core/types/personal-data-class.type";

/**
 * Registers `types` as declarations of module `module`.
 *
 * @param module - the declaring module's key (`crm`).
 * @throws TypeError when the module key is not snake_case or a class is not a `PersonalData` declaration.
 * @example
 * registerPersonalData("crm", [CustomerPersonalData, AddressPersonalData]);
 */
export function registerPersonalData(module: string, types: readonly PersonalDataClass[]): void {
  if (!/^[a-z][a-z0-9_]*$/.test(module))
    throw new TypeError(`registerPersonalData: ${JSON.stringify(module)} is not a module key`);
  for (const type of types) {
    if (kindOf(type)?.kind !== "personal_data")
      throw new TypeError(`registerPersonalData: ${type.name} is not a PersonalData declaration`);
    if (!PERSONAL_DATA_CLASSES.has(type)) PERSONAL_DATA_CLASSES.set(type, module);
  }
}
