/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./browser` entry of @stackra/theming (`BrowserSystemColorSchemeDriver` and
 *          `BrowserSystemAccessibilityDriver`), the browser-only drivers gen lists as the `SystemColorScheme` and
 *          `SystemAccessibility` candidates for the web targets, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `./contracts` only; never loaded on a server or a
 *           device.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./browser` entry); the STA-347 stand-in
 *                     barrel decision.
 */
export { BrowserSystemAccessibilityDriver } from "#browser/drivers/browser-system-accessibility.driver";
export { BrowserSystemColorSchemeDriver } from "#browser/drivers/browser-system-color-scheme.driver";
