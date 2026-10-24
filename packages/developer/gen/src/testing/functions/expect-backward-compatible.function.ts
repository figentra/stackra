/**
 * Stackra file contract:
 * Purpose: `expectBackwardCompatible`, the contract-test assertion that a new manifest only adds to the last
 *          released one: it fails listing every break `compareManifests` finds (a removed action, event, permission,
 *          extension point or refusal code, a moved endpoint, a narrowed input, a widened output, an event change
 *          dropped before its sunset).
 * Boundary: throws an `Error` whose message lists each break on its own line; returns nothing when compatible. A break
 *           needs a dated change, a new event version or a new key; a rename needs `@Renamed`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 22); ADR 0158; ADR 0131 (deprecation and sunset); ADR 0260.
 */
import type { StackraManifest } from "@stackra/contracts";

import { compareManifests } from "#core/functions/compare-manifests.function";

/**
 * Asserts that `next` is backward compatible with `previous`.
 *
 * @param previous - the manifest of the last release (`previousRelease`).
 * @param next - the committed manifest (`loadManifest`).
 * @param options - `today` fixes the date the sunset rule compares with.
 * @throws Error listing every break.
 * @example
 * expectBackwardCompatible(await previousRelease("@acme/loyalty-kit"), await loadManifest("./stackra.manifest.json"));
 */
export function expectBackwardCompatible(
  previous: StackraManifest,
  next: StackraManifest,
  options: { readonly today?: string } = {},
): void {
  const breaks = compareManifests(previous, next, options.today);
  if (breaks.length === 0) return;
  const lines = breaks.map((entry) => `  ${entry.section} ${entry.identity}: ${entry.message}`);
  throw new Error(
    `${next.package} is not backward compatible with its last release (${breaks.length} break${breaks.length === 1 ? "" : "s"}):\n` +
      `${lines.join("\n")}\n` +
      "A break needs a dated change, a new event version or a new key; a rename needs @Renamed(old).",
  );
}
