/**
 * Stackra file contract:
 * Purpose: the `feature-flags` oxlint JS plugin as `base.jsonc` loads it: the source file inside this repository, the
 *          published `@stackra/feature-flags/lint` everywhere else.
 * Boundary: re-exports the plugin and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0421 (lint from source in the repo, built dist outside it); ADR 0213 (decision 7).
 */
import { existsSync } from "node:fs";

// The relative path exists only in the stackra repository, where lint never waits for a build; under node_modules it
// points nowhere, so a consumer loads the package's built plugin instead.
const source = new URL(
  "../../../../state/feature-flags/src/lint/constants/feature-flags-lint-plugin.constant.ts",
  import.meta.url,
);

export default (await import(existsSync(source) ? source.href : "@stackra/feature-flags/lint"))
  .default;
