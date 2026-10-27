/**
 * Stackra file contract:
 * Purpose: `registerPersonalData`, which adds declaration classes to the set the DSAR export and the erasure saga
 *          walk. A module calls it once with its declarations.
 * Boundary: refuses a class that is not a `PersonalData` declaration; registering a class twice keeps one entry.
 *           shortcut: called by hand until gen registers every `privacy/` group class (STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); STA-1375.
 */
import { kindOf } from "@stackra/container";

import { PERSONAL_DATA_CLASSES } from "#core/constants/personal-data-classes.constant";
import type { PersonalDataClass } from "#core/types/personal-data-class.type";

/**
 * Registers `types`.
 *
 * @throws TypeError when a class is not a `PersonalData` declaration.
 * @example
 * registerPersonalData([CustomerPersonalData, AddressPersonalData]);
 */
export function registerPersonalData(types: readonly PersonalDataClass[]): void {
  for (const type of types) {
    if (kindOf(type)?.kind !== "personal_data")
      throw new TypeError(`registerPersonalData: ${type.name} is not a PersonalData declaration`);
    PERSONAL_DATA_CLASSES.add(type);
  }
}
