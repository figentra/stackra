/**
 * Stackra file contract:
 * Purpose: `specFolderOf(folder)`, the prefix and issue number of a spec folder named `<prefix>-<n>-<slug>`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPEC_FOLDER } from "../constants/spec-folder.constant.ts";

/**
 * The parts of a spec folder name, or `undefined` when it is not one.
 *
 * @param folder - the folder name (`os-12-billing`).
 * @example
 * specFolderOf("os-12-billing"); // { prefix: "os", number: "12" }
 */
export function specFolderOf(folder: string): { prefix: string; number: string } | undefined {
  const [, prefix, number] = SPEC_FOLDER.exec(folder) ?? [];
  return prefix === undefined || number === undefined ? undefined : { prefix, number };
}
