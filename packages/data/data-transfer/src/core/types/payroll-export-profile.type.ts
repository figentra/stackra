/**
 * Stackra file contract:
 * Purpose: `PayrollExportProfile`, a parsed per-provider payroll export profile.
 * Boundary: a type only, inferred from `PAYROLL_EXPORT_PROFILE_SCHEMA`.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 4).
 */
import type { z } from "zod";

import type { PAYROLL_EXPORT_PROFILE_SCHEMA } from "#core/constants/payroll-export-profile-schema.constant";

/** A payroll export profile. */
export type PayrollExportProfile = z.infer<typeof PAYROLL_EXPORT_PROFILE_SCHEMA>;
