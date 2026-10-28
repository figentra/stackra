/**
 * Stackra file contract:
 * Purpose: `readManifests(root)`, every member's committed `stackra.manifest.json` under the repository root
 *          (`apps/*`, `services/*`, `workers/*`, `packages/<category>/*`), in path order.
 * Boundary: reads files only; a member without a manifest (not generated yet) is skipped. Never writes.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R10: the committed manifest is the contract); ADR 0282 (decision 5: inspect the
 *                     manifest).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

/** The sub-folders of `folder`, sorted; none when it is missing. */
const folders = (folder: string): string[] =>
  existsSync(folder)
    ? readdirSync(folder, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(folder, entry.name))
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort()
    : [];

/**
 * The manifests of the repository at `root`.
 *
 * @param root - the repository root.
 * @throws SyntaxError when a manifest is not JSON.
 * @example
 * readManifests(process.cwd()).flatMap((manifest) => manifest.actions ?? []);
 */
export function readManifests(root: string): StackraManifest[] {
  return [
    ...folders(join(root, "apps")),
    ...folders(join(root, "packages")).flatMap(folders),
    ...folders(join(root, "services")),
    ...folders(join(root, "workers")),
  ]
    .map((member) => join(member, "stackra.manifest.json"))
    .filter((file) => existsSync(file))
    .map((file) => JSON.parse(readFileSync(file, "utf8")) as StackraManifest);
}
