/**
 * Stackra file contract:
 * Purpose: `isPublicNpmRegistry(url)`, whether a registry URL points at a public npm registry (`PUBLIC_NPM_REGISTRIES`),
 *          where a Stackra scope must never resolve from.
 * Boundary: pure; a value that is not a URL is not a public registry (the caller reports it as unreadable).
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 4 and 10).
 */
import { PUBLIC_NPM_REGISTRIES } from "#node/constants/public-npm-registries.constant";

/**
 * Whether the registry is a public npm registry.
 *
 * @param url - a registry URL, as an `.npmrc` line or `pnpm config get` gives it.
 * @example
 * isPublicNpmRegistry("https://registry.npmjs.org/"); // true
 * isPublicNpmRegistry("https://npm.stackra.figentra.com/"); // false
 */
export function isPublicNpmRegistry(url: string): boolean {
  if (!URL.canParse(url)) return false;
  return PUBLIC_NPM_REGISTRIES.includes(new URL(url).hostname.toLowerCase());
}
