/**
 * Stackra file contract:
 * Purpose: `PUBLIC_NPM_REGISTRIES`, the hosts of public npm registries where anyone can publish under a name, so a
 *          Stackra scope (`@stackra`, `@stackra-pro`) mapped to one of them is a dependency-confusion hole: npmjs and
 *          its mirrors (Yarn, npmmirror) and GitHub Packages (a scope there is whoever owns that GitHub account).
 * Boundary: data only; hosts are lower-case and compared without a port.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 4: the registry never proxies npmjs; decision 10: the consumer `.npmrc` maps
 *                     the Stackra scopes to the Stackra registry).
 */

/** The public npm registry hosts a Stackra scope must never resolve from. */
export const PUBLIC_NPM_REGISTRIES: readonly string[] = [
  "registry.npmjs.org",
  "registry.npmjs.com",
  "registry.yarnpkg.com",
  "registry.npmmirror.com",
  "registry.npm.taobao.org",
  "npm.pkg.github.com",
];
