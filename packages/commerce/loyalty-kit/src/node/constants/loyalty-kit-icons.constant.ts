/**
 * Stackra file contract:
 * Purpose: `LOYALTY_KIT_ICONS`, the icon names the kit's panel declarations use (`LOYALTY_KIT_ICONS.Star` is `"star"`).
 * Boundary: internal; not exported from an entry. The stand-in for gen's generated `Icons` constant, so no navigation
 *           entry writes a raw icon string (R-56); each name is a Lucide name `@stackra/panel` checks as an `IconName`
 *           where it is used. Delete it with STA-339.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10: icons by name); ADR 0322 (generated constants); owner decision R-56.
 */

/** The kit's icons, keyed as gen keys `Icons`. */
export const LOYALTY_KIT_ICONS = Object.freeze({ Star: "star" } as const);
