/**
 * Stackra file contract:
 * Purpose: `HOOK_TIMEOUT_MS`, the per-hook timeout of the unit preset.
 * Boundary: a number; a `beforeAll` may boot and migrate a PGlite, and a loaded box doubles that.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */

/** How long a setup or teardown hook may run before vitest fails it: 60 s, enough for a PGlite boot on a loaded box. */
export const HOOK_TIMEOUT_MS = 60_000;
