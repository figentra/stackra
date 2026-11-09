/**
 * Stackra file contract:
 * Purpose: `checkOptionalPeerImports(member)`, the findings of a library that statically imports a value from an
 *          OPTIONAL peer (`peerDependenciesMeta[name].optional`) in a file outside a platform entry: any consumer that
 *          loads that entry without the peer installed fails at import (BILLING-A's usage tests on 0.32.0's
 *          `@stackra/config/node`, which imported `@aws-sdk/client-secrets-manager` eagerly).
 * Boundary: pure: the caller passes the parsed package.json and each non-test source file's path and text. A platform
 *           entry (`src/react`, `src/native`, `src/desktop`, `src/browser`, `src/worker`, `src/e2e`, `src/testing`)
 *           may import its platform's optional peers, since only that platform loads it. React, React DOM and React
 *           Native are framework peers every consumer of a UI entry has, and are not judged. The fix is a dynamic
 *           `await import("<peer>")` where the peer is first needed, or making the peer required.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15: entries); the 0.32.0 lazy-peer gap (2026-11-09).
 */
import { valueImportsOf } from "#node/functions/value-imports-of.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

/** The folders under `src/` a single platform loads, which may import its optional peers. */
const PLATFORM_ENTRIES = ["react", "native", "desktop", "browser", "worker", "e2e", "testing"];

/** Framework peers every consumer of a UI entry has. */
const FRAMEWORK_PEERS: ReadonlySet<string> = new Set(["react", "react-dom", "react-native"]);

/**
 * The optional-peer findings of one library.
 *
 * @param member - its parsed package.json, and the path (relative to the package) and text of each non-test source.
 * @example
 * checkOptionalPeerImports({ pkg, sources: [{ path: "src/node/drivers/x.driver.ts", text: 'import { X } from "@aws-sdk/client-x";' }] });
 * // ["src/node/drivers/x.driver.ts imports a value of the optional peer @aws-sdk/client-x eagerly: …"]
 */
export function checkOptionalPeerImports(member: {
  readonly pkg: PackageManifest;
  readonly sources: readonly { readonly path: string; readonly text: string }[];
}): string[] {
  const meta = member.pkg.peerDependenciesMeta ?? {};
  const optional = Object.keys(member.pkg.peerDependencies ?? {}).filter(
    (name) => !FRAMEWORK_PEERS.has(name) && meta[name]?.optional === true,
  );
  if (optional.length === 0) return [];
  const out: string[] = [];
  for (const { path, text } of member.sources) {
    if (PLATFORM_ENTRIES.some((entry) => path.startsWith(`src/${entry}/`))) continue;
    for (const spec of valueImportsOf(text)) {
      const peer = optional.find((name) => spec === name || spec.startsWith(`${name}/`));
      if (peer !== undefined)
        out.push(
          `${path} imports a value of the optional peer ${peer} eagerly, so loading its entry without ${peer} installed fails: import it where it is first needed (\`await import("${spec}")\`), or make the peer required`,
        );
    }
  }
  return out;
}
