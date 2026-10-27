/**
 * Stackra file contract:
 * Purpose: `SEVEN_LANGUAGE_MEMBERS`, the framework UI members whose catalogues ship in all seven base languages.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0403; ADR 0461 (ui-pro moved to figentra/stackra-pro).
 */

/** The framework UI members whose catalogues ship in all seven base languages (ADR 0403). */
export const SEVEN_LANGUAGE_MEMBERS: readonly string[] = [
  "packages/communication/notifications",
  "packages/design-system/ui",
  "packages/experience/panel",
  "packages/security/consent",
];
