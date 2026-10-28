/**
 * Stackra file contract:
 * Purpose: `emitPrefixes`, the member's `#stackra/prefixes` (`.stackra/gen/prefixes.ts`): every public id prefix its
 *          models and its hosted packages' models mint, with the model key that owns it, so code that meets an id can
 *          tell its model from the prefix alone.
 * Boundary: pure; read from the manifest's models, which the prefix checks have already passed (one owner per
 *           prefix). A member without a public id gets no file.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (rule 2: each prefix registered in the manifest); ADR 0294 (decision 20).
 */
import type { StackraManifest } from "@stackra/contracts";

import { generatedHeader } from "#core/functions/generated-header.function";

/**
 * The prefixes file of a manifest, or undefined when no model has a public id.
 *
 * @example
 * emitPrefixes(manifest); // "...export const PUBLIC_ID_PREFIXES = {\n  ord: \"orders.order\",\n} as const;\n"
 */
export function emitPrefixes(manifest: StackraManifest): string | undefined {
  const rows = new Map<string, string>();
  for (const model of manifest.models ?? [])
    if (typeof model.publicId === "string" && !rows.has(model.publicId))
      rows.set(model.publicId, model.key);
  if (rows.size === 0) return undefined;
  const header = generatedHeader({
    from: "the models of stackra.manifest.json",
    purpose: `the public id prefixes of ${manifest.package} and its hosted packages, each with its model key.`,
    boundary:
      "data only; gen refuses a prefix two models share or one the registry in @stackra/gen gives away.",
    runtime: "isomorphic",
  });
  return [
    header,
    "/** Prefix to the model that mints it. */",
    "export const PUBLIC_ID_PREFIXES = {",
    ...[...rows]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([prefix, key]) => `  ${prefix}: ${JSON.stringify(key)},`),
    "} as const;",
    "",
  ].join("\n");
}
