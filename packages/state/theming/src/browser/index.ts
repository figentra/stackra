/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./browser` entry of @stackra/theming (`BrowserSystemColorSchemeDriver`), the
 *          browser-only driver gen lists as the `SystemColorScheme` candidate for the web targets, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Imports `./contracts` only; never loaded on a server or a
 *           device.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./browser` entry); the STA-347 stand-in
 *                     barrel decision.
 */
export { BrowserSystemColorSchemeDriver } from "#browser/drivers/browser-system-color-scheme.driver";
