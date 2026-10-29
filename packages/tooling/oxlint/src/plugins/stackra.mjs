/**
 * Stackra file contract:
 * Purpose: the `stackra` oxlint JS plugin as `base.jsonc` loads it: the source file inside this repository, the
 *          published `@stackra/coding-standard` everywhere else.
 * Boundary: re-exports the plugin and declares nothing.
 * Runtime: node
 * Governing contract: ADR 0421 (lint from source in the repo, built dist outside it); ADR 0129.
 */
import { existsSync } from "node:fs";

// The relative path exists only in the stackra repository, where lint never waits for a build; under node_modules it
// points nowhere, so a consumer loads the package's built plugin instead.
const source = new URL(
  "../../../../developer/coding-standard/src/core/constants/stackra-plugin.constant.ts",
  import.meta.url,
);

export default (await import(existsSync(source) ? source.href : "@stackra/coding-standard"))
  .default;
