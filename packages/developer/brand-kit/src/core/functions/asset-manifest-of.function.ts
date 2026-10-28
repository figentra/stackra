/**
 * Stackra file contract:
 * Purpose: `assetManifestOf`, the asset manifest of one run's files: the kit id, the input hash, and per file its
 *          path, kind, SHA-256 and size, sorted by path. The never-committed check (stackra-13) reads it.
 * Boundary: pure apart from hashing.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: generated files never committed).
 */
import type { AssetManifest } from "#contracts/types/asset-manifest.type";
import type { GeneratedFile } from "#contracts/types/generated-file.type";
import type { KitInput } from "#contracts/types/kit-input.type";
import { sha256Hex } from "#core/functions/sha256-hex.function";

/**
 * The manifest of `files`.
 *
 * @example
 * const manifest = assetManifestOf(input, await generateBrand(input, outputs, render));
 */
export function assetManifestOf(input: KitInput, files: readonly GeneratedFile[]): AssetManifest {
  return {
    kit: input.kit.id,
    inputHash: input.inputHash,
    files: [...files]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
      .map(({ path, output, bytes }) => ({
        path,
        output,
        sha256: sha256Hex(bytes),
        bytes: bytes.byteLength,
      })),
  };
}
