/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/privacy (the `ErasureMethod` enum, the
 *          `PersonalDataStore` and `SubjectSaltStore` ports and the types they exchange) until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package (ADR
 *           0294 decision 15). `KeptRecords` is @stackra/workflow's and `DataClassification` @stackra/contracts';
 *           neither is re-exported here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ErasureMethod } from "#contracts/enums/erasure-method.enum";
export { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
export { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";
export type { ErasedRecords } from "#contracts/types/erased-records.type";
export type { ErasureReceipt } from "#contracts/types/erasure-receipt.type";
export type { PersonalDataOptions } from "#contracts/types/personal-data-options.type";
export type { SubjectExport } from "#contracts/types/subject-export.type";
export type { SubjectExportSection } from "#contracts/types/subject-export-section.type";
export type { SubjectRecord } from "#contracts/types/subject-record.type";
