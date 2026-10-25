/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/registry, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema constant stays internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { CatalogueDiagnosticCode } from "#core/enums/catalogue-diagnostic-code.enum";
export { validateCatalogue } from "#core/functions/validate-catalogue.function";
export { CatalogueManifest } from "#core/schemas/catalogue-manifest.schema";
export type { CatalogueDiagnostic } from "#core/types/catalogue-diagnostic.type";
