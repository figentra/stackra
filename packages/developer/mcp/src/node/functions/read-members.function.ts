/**
 * Stackra file contract:
 * Purpose: `readMembers(root)`, every member folder under the repository root (`apps/*`, `packages/<category>/*`,
 *          `services/*`, `workers/*`) that holds a `package.json` or a `stackra.manifest.json`, in path order, each
 *          a `@stackra/repo-checks` `WorkspaceMember` (package name, folder, absolute folder) with its committed
 *          manifest when it has one.
 * Boundary: reads files only; never writes. A member without a manifest (not generated yet) is listed without one.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R10: the committed manifest is the contract); ADR 0282 (decision 5: inspect the
 *                     manifest).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import type { ManifestMember } from "#node/types/manifest-member.type";

/** The sub-folders of `folder` (relative to `root`), sorted; none when it is missing. */
const folders = (root: string, folder: string): string[] =>
  existsSync(join(root, folder))
    ? readdirSync(join(root, folder), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `${folder}/${entry.name}`)
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort()
    : [];

/** The parsed JSON file at `file`, or undefined when there is none. */
const json = (file: string): unknown =>
  existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : undefined;

/**
 * The members of the repository at `root`.
 *
 * @param root - the repository root.
 * @throws SyntaxError when a `package.json` or a manifest is not JSON.
 * @example
 * readMembers(process.cwd()).flatMap((member) => member.manifest?.actions ?? []);
 */
export function readMembers(root: string): ManifestMember[] {
  return [
    ...folders(root, "apps"),
    ...folders(root, "packages").flatMap((category) => folders(root, category)),
    ...folders(root, "services"),
    ...folders(root, "workers"),
  ].flatMap((path) => {
    const manifest = json(join(root, path, "stackra.manifest.json")) as StackraManifest | undefined;
    const pkg = json(join(root, path, "package.json")) as { name?: unknown } | undefined;
    if (manifest === undefined && pkg === undefined) return [];
    return [
      {
        name: typeof pkg?.name === "string" ? pkg.name : undefined,
        dir: path,
        path: join(root, path),
        ...(manifest === undefined ? {} : { manifest }),
      },
    ];
  });
}
