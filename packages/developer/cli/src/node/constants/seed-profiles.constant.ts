/**
 * Stackra file contract:
 * Purpose: `SEED_PROFILES`, the three seed profiles of a product seed pack and the layers each one loads, in order:
 *          `minimal` (a new tenant's defaults), `demo` (minimal plus the synthetic demo data a sandbox or trial
 *          holds) and `test` (minimal plus the fixtures the end-to-end tier runs on).
 * Boundary: frozen data. The profile names are ADR 0190's; which records a profile holds is the pack's data.
 * Runtime: node
 * Governing contract: ADR 0190 (decision 1: three profiles); ADR 0325 (decision 7: seeds); OS-17 (a sandbox holds live
 *                     config plus the demo seed); config-model section 6.
 */

/** Each profile and the profile folders it loads, first to last. */
export const SEED_PROFILES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  minimal: Object.freeze(["minimal"]),
  demo: Object.freeze(["minimal", "demo"]),
  test: Object.freeze(["minimal", "test"]),
});
