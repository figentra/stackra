/**
 * Stackra file contract:
 * Purpose: `SAFETY_CRITICAL_VARIABLES`, the runtime variables whose fields the values layer may never set: a
 *          configuration field mapped to one of them is read from the runtime environment only. `buildConfig` refuses
 *          a value for such a field at boot, and `runway validate` refuses it in a runway `config` block before a
 *          deploy. The running environment (`STACKRA_ENVIRONMENT`) is the first: a value of `dev` there would let a
 *          deployment keep memory stores, skip its audit trail or accept dev sign-in (STA-2844). The dev sign-in's
 *          public key set (`STACKRA_DEV_ISSUER_KEYS`, `app.bearer.devKeys` of @stackra/app) is the second: only
 *          `stackra dev` sets it, on the process it runs, so no runway file or values layer can hand a deployment
 *          keys that sign tokens (STA-2795).
 * Boundary: a frozen list of names. Adding a name here makes every field mapped to it runtime-only everywhere at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (amendment 2026-11-26: safety-critical keys never come from the values layer);
 *                     STA-2844; ADR 0206 (amendment 2026-11-26: the dev issuer); STA-2795.
 */
import { ENVIRONMENT_VARIABLE } from "#core/constants/environment-variable.constant";

/** The variables only the runtime environment may set. */
export const SAFETY_CRITICAL_VARIABLES: readonly string[] = Object.freeze([
  ENVIRONMENT_VARIABLE,
  // The dev sign-in's public key set: `stackra dev` sets it on the process it runs, never a value (STA-2795).
  "STACKRA_DEV_ISSUER_KEYS",
]);
