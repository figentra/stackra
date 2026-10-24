/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./browser` entry of @stackra/platform (`WebPlatformDriver`, `WebPushTransportDriver`),
 *          the browser drivers gen lists as candidates for the web and PWA targets, until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Never loaded on a server or a device; the scanner view and
 *           the helpers stay internal.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./browser` entry); the STA-347 stand-in
 *                     barrel decision.
 */
export { WebPlatformDriver } from "#browser/drivers/web-platform.driver";
export { WebPushTransportDriver } from "#browser/drivers/web-push-transport.driver";
