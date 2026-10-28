/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/privacy (the configuration and its shipped schema, the
 *          `PersonalData` kind and its registry, the DSAR export service, the memory drivers and the `SubjectErased`
 *          receipt event) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `contracts`, never `node` or `testing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { PrivacyConfig } from "#config/privacy.config";
export { PersonalData } from "#core/bases/personal-data.base";
export { PERSONAL_DATA_STORE_DRIVERS } from "#core/constants/personal-data-store-drivers.constant";
export { PRIVACY_CONFIG_SCHEMA as PrivacyConfig$ } from "#core/constants/privacy-config-schema.constant";
export { MemoryPersonalDataStoreDriver } from "#core/drivers/memory-personal-data-store.driver";
export { MemorySubjectSaltStoreDriver } from "#core/drivers/memory-subject-salt-store.driver";
export { SubjectErased } from "#core/events/subject-erased.event";
export { personalDataDeclarations } from "#core/functions/personal-data-declarations.function";
export { registerPersonalData } from "#core/functions/register-personal-data.function";
export { ErasedRecordsLine } from "#core/schemas/erased-records-line.schema";
export { PrivacyOptions } from "#core/schemas/privacy-options.schema";
export { SubjectExportService } from "#core/services/subject-export.service";
export type { PersonalDataClass } from "#core/types/personal-data-class.type";
export type { PersonalDataDeclaration } from "#core/types/personal-data-declaration.type";
export type { SubjectExportLink } from "#core/types/subject-export-link.type";
