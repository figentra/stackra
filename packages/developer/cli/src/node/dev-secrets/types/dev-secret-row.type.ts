/**
 * Stackra file contract:
 * Purpose: `DevSecretRow`, one `env` row of a committed `stackra.manifest.json`, as dev secrets read it.
 * Boundary: type only; gen writes the rows (`envOf`).
 * Runtime: node
 * Governing contract: ADR 0173 (amendment of 2026-11-04, carried by ADR 0525); STA-2679.
 */
import type { StackraManifest } from "@stackra/contracts";

/** One declared variable or secret of a member. */
export type DevSecretRow = NonNullable<StackraManifest["env"]>[number];
