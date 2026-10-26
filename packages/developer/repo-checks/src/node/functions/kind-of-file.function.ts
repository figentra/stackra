/**
 * Stackra file contract:
 * Purpose: `kindOfFile(fileName)`, the kind of a source file from its name: a root module, a React hook, or a
 *          `<subject>.<suffix>.ts(x)` file with a known suffix.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0126; ADR 0128; ADR 0129.
 */
import { KIND_FOLDERS } from "#node/constants/kind-folders.constant";
import { REACT_HOOK } from "#node/constants/react-hook.constant";
import { ROOT_MODULE } from "#node/constants/root-module.constant";
import type { KindFolder } from "#node/types/kind-folder.type";

/**
 * The kind of `fileName`, or null for anything that is not a known kind.
 *
 * @param fileName - a file name, no folder.
 * @example
 * kindOfFile("create-user.action.ts")?.folder; // "actions"
 */
export function kindOfFile(fileName: string): KindFolder | null {
  if (/^use-[a-z0-9-]+\.tsx?$/.test(fileName)) return REACT_HOOK;
  const match = /\.([a-z]+)\.tsx?$/.exec(fileName);
  if (!match) return null;
  if (match[1] === ROOT_MODULE.suffix) return ROOT_MODULE;
  return KIND_FOLDERS.find((k) => k.suffix === match[1]) ?? null;
}
