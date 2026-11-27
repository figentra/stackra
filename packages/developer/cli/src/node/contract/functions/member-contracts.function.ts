/**
 * Stackra file contract:
 * Purpose: `memberContracts(root, base)`, the HTTP contract of every workspace member that had one at the commit
 *          `base`: the OpenAPI projection (`openApiOf`) of its `stackra.manifest.json` at `base` and in the working
 *          tree, each made self-contained by `inlineExternalSchemas` with the manifests of the same side (a mounted
 *          package's shapes come from that package's manifest at `base`, or now; a package outside the workspace from
 *          its installed copy under `node_modules`). A member whose manifest is new has no baseline (every operation is
 *          an addition) and is left out; a member removed since `base` projects to no path, so each of its operations
 *          reads as removed. Members are the folders the workspace globs of `pnpm-workspace.yaml` match, so test
 *          fixtures elsewhere in the tree never count. A manifest that cannot be read or projected is a problem line,
 *          never skipped.
 * Boundary: reads `pnpm-workspace.yaml`, the working tree's manifests (installed ones under `node_modules` included)
 *           and, read-only through `git` (`ls-tree`, `show`), the manifests at `base`; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: `oasdiff` contract checks on the service manifests); ADR 0158 (openapi.json
 *                     is the manifest's projection); ADR 0294 (decision 10: the committed manifest); STA-2837.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";
import { openApiOf } from "@stackra/gen";
import { parse } from "yaml";

import { inlineExternalSchemas } from "#node/contract/functions/inline-external-schemas.function";
import type { MemberContract } from "#node/contract/types/member-contract.type";
import type { DirFinding } from "#node/types/dir-finding.type";

/** The committed contract file of a member. */
const MANIFEST = "stackra.manifest.json";

/** Whether `dir` is one of the folders `glob` (`packages/*` + `/*`) names, as pnpm expands it. */
function matchesGlob(dir: string, glob: string): boolean {
  const want = glob.split("/").filter(Boolean);
  const have = dir.split("/");
  return (
    want.length === have.length &&
    want.every((segment, index) =>
      segment === "*" ? !(have[index] ?? ".").startsWith(".") : segment === have[index],
    )
  );
}

/** The folders under `root` that `glob` names. */
function expand(root: string, glob: string): string[] {
  let dirs = [""];
  for (const segment of glob.split("/").filter(Boolean))
    dirs = dirs.flatMap((dir) => {
      if (segment !== "*") return existsSync(join(root, dir, segment)) ? [join(dir, segment)] : [];
      if (!existsSync(join(root, dir))) return [];
      return readdirSync(join(root, dir), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => join(dir, entry.name));
    });
  return dirs;
}

/**
 * The members that had a contract at `base`, each projected at `base` and now, and a problem per unreadable side.
 *
 * @param root - the workspace root, inside a git checkout.
 * @param base - the commit to compare with (a merge base, `HEAD~1`, a release tag).
 * @throws Error when `git` cannot list `base` (an unknown ref, a shallow clone without it).
 * @example
 * memberContracts("/repo", "4f2a91c"); // { contracts: [{ dir: "services/billing", base, next }], problems: [] }
 */
export function memberContracts(
  root: string,
  base: string,
): { readonly contracts: readonly MemberContract[]; readonly problems: readonly DirFinding[] } {
  const { packages = [] } = (parse(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8")) ??
    {}) as { packages?: string[] };
  const globs = packages.filter((glob) => !glob.startsWith("!"));
  const git = (args: readonly string[]): string =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  const baseDirs = git(["ls-tree", "-r", "--name-only", base])
    .split("\n")
    .filter((path) => path.endsWith(`/${MANIFEST}`))
    .map((path) => path.slice(0, -MANIFEST.length - 1))
    .filter((dir) => globs.some((glob) => matchesGlob(dir, glob)))
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds
    .sort();
  const nextDirs = [...new Set(globs.flatMap((glob) => expand(root, glob)))].filter((dir) =>
    existsSync(join(root, dir, MANIFEST)),
  );

  const problems: DirFinding[] = [];
  const read = (dir: string, side: string, text: () => string): StackraManifest | undefined => {
    try {
      return JSON.parse(text()) as StackraManifest;
    } catch (error) {
      problems.push({
        dir,
        text: `cannot project ${MANIFEST} ${side}: ${(error as Error).message.split("\n")[0]}`,
      });
      return undefined;
    }
  };
  const before = new Map<string, StackraManifest | undefined>(
    baseDirs.map((dir) => [
      dir,
      read(dir, `at ${base}`, () => git(["show", `${base}:${dir}/${MANIFEST}`])),
    ]),
  );
  const after = new Map<string, StackraManifest | undefined>(
    nextDirs.map((dir) => [
      dir,
      read(dir, "in the working tree", () => readFileSync(join(root, dir, MANIFEST), "utf8")),
    ]),
  );
  // A mounted package's manifest on one side: the workspace member's, else the installed copy.
  const lookup = (side: Map<string, StackraManifest | undefined>) => {
    const byPackage = new Map(
      [...side.values()].flatMap((manifest) =>
        manifest === undefined ? [] : [[manifest.package, manifest] as const],
      ),
    );
    return (dir: string) =>
      (packageName: string): StackraManifest | undefined => {
        const found = byPackage.get(packageName);
        if (found !== undefined) return found;
        for (const at of [join(root, dir), root]) {
          const file = join(at, "node_modules", packageName, MANIFEST);
          if (existsSync(file)) {
            try {
              return JSON.parse(readFileSync(file, "utf8")) as StackraManifest;
            } catch {
              return undefined;
            }
          }
        }
        return undefined;
      };
  };
  const baseOf = lookup(before);
  const nextOf = lookup(after);

  const contracts: MemberContract[] = [];
  for (const [dir, previous] of before) {
    if (previous === undefined) continue;
    const current = after.get(dir);
    if (after.has(dir) && current === undefined) continue;
    try {
      const projected = inlineExternalSchemas(openApiOf(previous), baseOf(dir));
      contracts.push({
        dir,
        base: projected,
        next:
          current === undefined
            ? { ...projected, paths: {} }
            : inlineExternalSchemas(openApiOf(current), nextOf(dir)),
      });
    } catch (error) {
      problems.push({
        dir,
        text: `cannot project ${MANIFEST}: ${(error as Error).message.split("\n")[0]}`,
      });
    }
  }
  return { contracts, problems };
}
