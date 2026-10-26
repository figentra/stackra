/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/platform (`TurnstileCaptchaVerifierDriver`), the drivers gen
 *          lists for a Node service (an Encore service such as OS security-center), until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. The driver is the same class `./worker` exports: it uses
 *           only `fetch`, `FormData` and `AbortSignal`, which Node 18+ and Workers both provide.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./node` entry) and its 2026-10-26 note (a
 *                     portable driver from `./worker` and `./node`); the STA-347 stand-in barrel decision.
 */
export { TurnstileCaptchaVerifierDriver } from "#worker/drivers/turnstile-captcha-verifier.driver";
