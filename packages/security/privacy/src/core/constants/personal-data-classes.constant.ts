/**
 * Stackra file contract:
 * Purpose: `PERSONAL_DATA_CLASSES`, the registered personal-data declarations, in registration order.
 * Boundary: process-wide state written only by `registerPersonalData` and read only by `personalDataDeclarations`;
 *           the stand-in for the table gen writes from the `privacy/` groups (STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); STA-1375.
 */
import type { PersonalDataClass } from "#core/types/personal-data-class.type";

/** Every registered declaration class. */
export const PERSONAL_DATA_CLASSES = new Set<PersonalDataClass>();
