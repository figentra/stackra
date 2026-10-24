/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/consent, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `ConsentStore` and `ConsentRecord` are not here: they are
 *           exported from `./contracts` only (ADR 0294 decision 15). The shipped schema is re-exported under its
 *           generated name (`ConsentConfig$`). The record schema, its parser, the Global Privacy Control read and the
 *           storage key stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { ConsentConfig } from "#config/consent.config";
export { CONSENT_CONFIG_SCHEMA as ConsentConfig$ } from "#core/constants/consent-config-schema.constant";
export { CookieConsentStoreDriver } from "#core/drivers/cookie-consent-store.driver";
export { MemoryConsentStoreDriver } from "#core/drivers/memory-consent-store.driver";
export { StorageConsentStoreDriver } from "#core/drivers/storage-consent-store.driver";
export { ConsentCategory } from "#core/enums/consent-category.enum";
export { ConsentRegime } from "#core/enums/consent-regime.enum";
export { ConsentStatus } from "#core/enums/consent-status.enum";
export { ConsentOptions } from "#core/schemas/consent-options.schema";
export { ConsentLedger } from "#core/services/consent-ledger.service";
export type { ConsentCategoryEntry } from "#core/types/consent-category-entry.type";
