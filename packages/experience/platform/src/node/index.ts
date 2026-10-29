/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/platform (`TurnstileCaptchaVerifierDriver`,
 *          `ApnsLiveActivityPushesDriver`), the drivers gen lists for a Node service (an Encore service such as OS
 *          security-center), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The APNs driver needs `node:http2`, so it is Node only. The
 *           Turnstile driver is the same class `./worker` exports: it uses only `fetch`, `FormData` and `AbortSignal`,
 *           which Node 18+ and Workers both provide.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./node` entry) and its 2026-10-26 note (a
 *                     portable driver from `./worker` and `./node`); the STA-347 stand-in barrel decision.
 */
export { ApnsLiveActivityPushesDriver } from "#node/drivers/apns-live-activity-pushes.driver";
export { TurnstileCaptchaVerifierDriver } from "#worker/drivers/turnstile-captcha-verifier.driver";
