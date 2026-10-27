/**
 * Stackra file contract:
 * Purpose: `PersonalDataClass`, a class made with `PersonalData({...})`, as `registerPersonalData` takes it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25); STA-1375.
 */
import type { PersonalData } from "#core/bases/personal-data.base";

/** A personal-data declaration class. */
export type PersonalDataClass = new () => PersonalData;
