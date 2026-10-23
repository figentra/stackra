/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/ui, which has two public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { DesignSystemProvider } from "#react/design-system-provider/design-system-provider";
export { useDesignSystem } from "#react/design-system-provider/use-design-system";
