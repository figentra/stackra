/**
 * Stackra file contract:
 * Purpose: `PRO_WRAPPER`, the one package that wraps HeroUI Pro: its name, its folder, the restricted registry it publishes
 *          to and the `files` entry that keeps source maps out of its tarball.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 1 as amended by STA-447); ADR 0316 (decision 2); ADR 0177 (decision 2); ADR 0290
 *                     (decision 17).
 */

/**
 * The one package that wraps HeroUI Pro. It publishes only to the restricted Keygen channel, never to npmjs (ADR 0310
 * decision 1 as amended by STA-447): `"private": true` keeps `pnpm publish` and changesets from sending it to npmjs, and
 * its `pnpm pack` tarball goes up through the Keygen CLI (STA-482). The folder keeps its name while the package is
 * `@stackra-pro/ui`. The registry is Keygen's hosted npm engine for one account (ADR 0177 decision 2); the custom domain
 * is named later (ADR 0290 decision 17), so the pattern takes any account. The last `files` entry keeps source maps out
 * of the Pro tarball (ADR 0316 decision 2).
 */
export const PRO_WRAPPER = Object.freeze({
  name: "@stackra-pro/ui",
  dir: "packages/design-system/ui-pro",
  registry: /^https:\/\/npm\.pkg\.keygen\.sh\/[\w-]+\/$/,
  noSourceMaps: "!**/*.map",
});
