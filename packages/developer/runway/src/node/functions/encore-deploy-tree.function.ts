/**
 * Stackra file contract:
 * Purpose: `encoreDeployTree(request)`, the commit an Encore Cloud push ships. Encore builds the tree it receives, and
 *          the generated app is gitignored, so the source commit alone has no app. The repository root is the Encore
 *          app root, holding every service member of the product as one app (Pub/Sub topics and subscriptions only
 *          work inside one app, and a relay imports its producers' topics). In a temporary checkout of the source
 *          commit it adds each service member's generated outputs (`.stackra/` and the Encore services in `stackra-encore/`) and every workspace package's build
 *          output (`dist/`, `.stackra/`), rewrites each service member's `#` imports (package.json `imports`) to
 *          relative paths through that member's own map, since Encore resolves neither `imports` nor a per-member
 *          tsconfig, drops the members' `__tests__` folders (Encore parses every TypeScript file under the root),
 *          writes the generated `encore.app` at the root, and commits that tree as the deploy commit: a parentless
 *          commit whose message names the source commit, so a shallow CI checkout pushes it whole.
 * Boundary: reads the repository and writes only the temporary checkout (`git worktree add`), removed by `dispose`;
 *           runs `git` through the given runner. A repository with no generated service app gets `undefined`, and the
 *           caller pushes the source commit as it is.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2: the generated Encore app), ADR 0289 (decision 5: Encore Cloud), ADR 0233
 *                     (package.json imports), STA-136, STA-2155, STA-2194.
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { LINE_CHECKOUT_SETTINGS } from "#node/constants/line-checkout-settings.constant";
import { workspacePackages } from "#node/functions/workspace-packages.function";
import type { EncoreDeployTree } from "#node/types/encore-deploy-tree.type";
import type { EncoreDeployTreeRequest } from "#node/types/encore-deploy-tree-request.type";

/** The generated Encore app file of a service member, at the member root (ADR 0091, decision 2 as amended 2026-11-09). */
const GENERATED_APP = "encore.app";

/**
 * A service member's generated Encore services (`@stackra/gen`'s `ENCORE_SERVICES_DIR`), outside `.stackra`: Encore skips
 * dot folders when it discovers services.
 */
const ENCORE_SERVICES = "stackra-encore";

/** The build outputs a deploy tree carries from each workspace package and service member. */
const OUTPUTS = ["dist", ".stackra", ENCORE_SERVICES] as const;

/** The folders of a service member whose TypeScript files may import through `#` aliases. */
const SOURCES = ["src", ".stackra", ENCORE_SERVICES] as const;

/** A static, re-exported, side-effect or dynamic import of a `#` alias: lead, quote, specifier. */
const ALIAS_IMPORT = /(from\s+|import\s*\(\s*|import\s+)(["'])(#[^"']+)\2/g;

/** The service members with a generated Encore app, relative to the repository. */
function serviceApps(repository: string): string[] {
  const services = join(repository, "services");
  if (!existsSync(services)) return [];
  return readdirSync(services, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(services, entry.name, GENERATED_APP)))
    .map((entry) => join("services", entry.name))
    .toSorted();
}

/** The file a `#` specifier names through `imports`, the member's package.json map, or `undefined`. */
function aliasTarget(
  root: string,
  imports: Record<string, unknown>,
  spec: string,
): string | undefined {
  for (const [key, value] of Object.entries(imports)) {
    const prefix = key.endsWith("*") ? key.slice(0, -1) : undefined;
    if (prefix === undefined ? spec !== key : !spec.startsWith(prefix)) continue;
    const rest = prefix === undefined ? "" : spec.slice(prefix.length);
    for (const target of Array.isArray(value) ? value : [value]) {
      if (typeof target !== "string") continue;
      const path = join(root, target.replace("*", rest));
      if (existsSync(path) && statSync(path).isFile()) return path;
    }
  }
  return undefined;
}

/**
 * Rewrites the `#` imports of every TypeScript file under the member's sources to relative paths, in place, and drops
 * its `__tests__` folders. Returns the specifiers no target was found for.
 */
function rewriteMember(root: string): string[] {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as Record<
    string,
    unknown
  >;
  const imports =
    typeof manifest["imports"] === "object" && manifest["imports"] !== null
      ? (manifest["imports"] as Record<string, unknown>)
      : {};
  const unresolved: string[] = [];
  const walk = (folder: string): void => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__") rmSync(path, { recursive: true, force: true });
        else if (entry.name !== "node_modules") walk(path);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      const text = readFileSync(path, "utf8");
      const next = text.replace(ALIAS_IMPORT, (all, lead: string, quote: string, spec: string) => {
        const target = aliasTarget(root, imports, spec);
        if (target === undefined) {
          unresolved.push(`${relative(root, path)}: ${spec}`);
          return all;
        }
        let rel = relative(dirname(path), target)
          .replace(/\.tsx?$/, "")
          .replace(/\/index$/, "");
        if (!rel.startsWith(".")) rel = `./${rel}`;
        return `${lead}${quote}${rel}${quote}`;
      });
      if (next !== text) writeFileSync(path, next);
    }
  };
  for (const source of SOURCES) if (existsSync(join(root, source))) walk(join(root, source));
  return unresolved;
}

/**
 * Builds the deploy commit of the repository's generated Encore app: every service member in one app at the root.
 *
 * @param request - the repository, the source commit and the command runner.
 * @returns the deploy tree, or `undefined` when the repository has no generated service app.
 * @throws RunwayInvalidError when the service members' generated apps name different Encore app ids.
 * @throws RunwayUnresolvedError when a `#` import resolves through no member's map, before anything is committed.
 * @example
 * const tree = await encoreDeployTree({ repository: ".", sha, run: runProgram });
 * if (tree !== undefined) await run("git", ["push", "encore://acme", `+${tree.sha}:refs/heads/main`], {});
 */
export async function encoreDeployTree(
  request: EncoreDeployTreeRequest,
): Promise<EncoreDeployTree | undefined> {
  const { repository, sha, run } = request;
  const members = serviceApps(repository);
  if (members.length === 0) return undefined;
  const ids = new Set(
    members.map(
      (member) =>
        (
          JSON.parse(readFileSync(join(repository, member, GENERATED_APP), "utf8")) as {
            id?: unknown;
          }
        ).id,
    ),
  );
  if (ids.size > 1)
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: "providers.encore.app",
        message: `The service members' generated apps name different Encore app ids (${[...ids].join(", ")}): run stackra gen`,
      },
    ]);

  const tree = mkdtempSync(join(tmpdir(), "stackra-encore-"));
  await run("git", ["worktree", "add", "--detach", tree, sha], { cwd: repository });
  const dispose = async (): Promise<void> => {
    rmSync(tree, { recursive: true, force: true });
    await run("git", ["worktree", "prune"], { cwd: repository });
  };
  try {
    const added: string[] = [];
    const folders = [
      ...members,
      ...[...workspacePackages(repository).values()].map((pkg) => relative(repository, pkg.dir)),
    ];
    for (const folder of new Set(folders))
      for (const output of OUTPUTS) {
        const from = join(repository, folder, output);
        if (!existsSync(from)) continue;
        cpSync(from, join(tree, folder, output), {
          recursive: true,
          filter: (path) => !path.split(/[\\/]/).includes("node_modules"),
        });
        added.push(join(folder, output));
      }

    const unresolved = members.flatMap((member) =>
      rewriteMember(join(tree, member)).map((line) => `${member}/${line}`),
    );
    if (unresolved.length > 0)
      throw new RunwayUnresolvedError(
        `${unresolved.length} \`#\` import(s) resolve through no package.json imports entry: ${unresolved.slice(0, 5).join("; ")}`,
      );
    // The member root's encore.app is gitignored and outside the copied outputs, so it comes from the repository.
    copyFileSync(join(repository, members[0] as string, GENERATED_APP), join(tree, "encore.app"));

    // The members' folders whole: rewritten sources, dropped tests and the copied outputs.
    await run("git", ["add", "--all", "--force", "--", ...members, ...added, "encore.app"], {
      cwd: tree,
    });
    // A parentless commit: Encore's remote refuses a push that ends on a shallow clone's boundary ("shallow update
    // not allowed", a CI checkout at depth 1), and the product's history is not Encore's to hold.
    const files = (await run("git", ["write-tree"], { cwd: tree })).trim();
    const deploy = (
      await run(
        "git",
        [
          ...LINE_CHECKOUT_SETTINGS.gitIdentity,
          "commit-tree",
          files,
          "-m",
          `runway: the Encore app of ${members.join(", ")} at ${sha}`,
        ],
        { cwd: tree },
      )
    ).trim();
    return { sha: deploy, members, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}
