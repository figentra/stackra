/**
 * Stackra file contract:
 * Purpose: `DoctorGroup`, a heading of the `stackra doctor` checklist.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); STA-1966 spec FR-009.
 */

/** Where a check sits in the checklist. */
export type DoctorGroup = "Machine" | "Tools" | "Repo" | "Registries" | "Accounts";
