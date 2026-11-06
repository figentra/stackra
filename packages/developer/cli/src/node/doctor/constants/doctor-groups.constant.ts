/**
 * Stackra file contract:
 * Purpose: `DOCTOR_GROUPS`, the headings of the `stackra doctor` checklist in the order it shows them.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); STA-1966 spec FR-009.
 */
import type { DoctorGroup } from "#node/doctor/types/doctor-group.type";

/** The headings, in order. */
export const DOCTOR_GROUPS: readonly DoctorGroup[] = [
  "Machine",
  "Tools",
  "Repo",
  "Registries",
  "Accounts",
];
