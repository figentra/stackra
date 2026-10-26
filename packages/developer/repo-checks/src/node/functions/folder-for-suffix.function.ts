/**
 * Stackra file contract:
 * Purpose: `folderForSuffix(suffix)`, the pre-v3 folder a kind suffix belongs in.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0126; ADR 0130.
 */
import { KIND_FOLDERS } from "#node/constants/kind-folders.constant";

/**
 * The folder of `suffix`, or null when the suffix has no kind folder.
 *
 * @param suffix - a file kind, for example `schema`.
 * @example
 * folderForSuffix("schema"); // "schemas"
 */
export function folderForSuffix(suffix: string): string | null {
  return KIND_FOLDERS.find((k) => k.suffix === suffix)?.folder ?? null;
}
