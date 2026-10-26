/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/brand-kit, empty until stackra-12 (STA-957) writes the
 *          generator, until `stackra gen` writes the entry barrels (STA-339). The enums and types are exported from
 *          `./contracts` only.
 * Boundary: names each re-export and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15: one symbol, one entry); ADR 0441 (as amended: the generic generator).
 */
// oxlint-disable-next-line unicorn/require-module-specifiers -- empty until stackra-12; keeps the file a module
export {};
