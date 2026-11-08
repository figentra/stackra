/**
 * Stackra file contract:
 * Purpose: `checkHostedPeers(member)`, the findings of a library that uses the values of a `HOSTED_PEER_PACKAGES` entry
 *          but does not take it as a peer: it must be in `peerDependencies` (and `devDependencies` for its own tests),
 *          never `dependencies`, or pnpm resolves a second copy whose classes the host's store does not know.
 * Boundary: pure: the caller passes the parsed package.json and the text of the library's non-test source files. An
 *           `import type`, an import of types only and an exempt subpath use no value.
 * Runtime: node
 * Governing contract: ADR 0308; the payments 0.21.0 packaging regression (2026-11-08).
 */
import { HOSTED_PEER_PACKAGES } from "#node/constants/hosted-peer-packages.constant";
import type { PackageManifest } from "#node/types/package-manifest.type";

/** `import … from "<spec>"` and `export … from "<spec>"`, with what sits between the keyword and `from`. */
const FROM = /\b(import|export)\s+([^;]*?)\s+from\s+["']([^"']+)["']/g;

/** Whether an import or export clause brings in only types (`type X`, `{ type A, type B }`). */
function typesOnly(clause: string): boolean {
  if (/^type\b/.test(clause)) return true;
  const named = /^\{([^}]*)\}$/.exec(clause.trim())?.[1];
  if (named === undefined) return false;
  const items = named
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 && items.every((item) => item.startsWith("type "));
}

/** Whether `sources` use a value of `name` (outside its `exempt` subpaths). */
function usesValue(sources: readonly string[], name: string, exempt: readonly string[]): boolean {
  return sources.some((source) =>
    [...source.matchAll(FROM)].some(([, , clause = "", spec = ""]) => {
      if (spec !== name && !spec.startsWith(`${name}/`)) return false;
      if (exempt.some((sub) => spec === `${name}/${sub}`)) return false;
      return !typesOnly(clause);
    }),
  );
}

/**
 * The hosted-peer findings of one library.
 *
 * @param member - its parsed package.json and the text of its non-test source files.
 * @example
 * checkHostedPeers({ pkg: { name: "@stackra/payments", dependencies: { "@stackra/integrations": "workspace:*" } }, sources });
 * // ["@stackra/integrations must be a peer: …"] when a source imports a value from it
 */
export function checkHostedPeers(member: {
  readonly pkg: PackageManifest;
  readonly sources: readonly string[];
}): string[] {
  const { pkg, sources } = member;
  const out: string[] = [];
  for (const { name, exempt } of HOSTED_PEER_PACKAGES) {
    if (pkg.name === name || !usesValue(sources, name, exempt)) continue;
    if (pkg.dependencies?.[name] !== undefined || pkg.peerDependencies?.[name] === undefined)
      out.push(
        `${name} must be a peer: this package uses its values, and a second copy's classes are unknown to the host's (move it from dependencies to peerDependencies, with a devDependencies entry for its own tests)`,
      );
  }
  return out;
}
