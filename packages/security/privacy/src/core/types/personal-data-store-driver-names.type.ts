/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` augmentation that names the `PersonalDataStore` drivers, so
 *          `DriverName<PersonalDataStore>` narrows to them.
 * Boundary: a type-only module augmentation read from `PERSONAL_DATA_STORE_DRIVERS`; gen writes it once the wiring is
 *           generated (STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); STA-1375.
 */
import type { PERSONAL_DATA_STORE_DRIVERS } from "#core/constants/personal-data-store-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `PersonalDataStore` (`repository`, `memory`). */
    "privacy.PersonalDataStore": (typeof PERSONAL_DATA_STORE_DRIVERS)[number];
  }
}
