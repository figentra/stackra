/**
 * Stackra file contract:
 * Purpose: `encoreDeployTree(request)`, the commit an Encore Cloud push ships. Encore builds the tree it receives, and
 *          the generated app is gitignored, so the source commit alone has no app. On top of the source commit, in a
 *          temporary checkout, it adds the service member's generated outputs (`.stackra/`), every workspace package's
 *          build output (`dist/`, `.stackra/`), the member's `encore.app` (copied from `.stackra/encore/encore.app`, so
 *          the member folder is the Encore app root, beside its package.json) and a `tsconfig.json` whose `paths`
 *          mirror the member's package.json `imports` (Encore's resolver does not read `imports`); the member's own
 *          tsconfig is kept as `tsconfig.member.json` and extended. It commits that as the deploy commit.
 * Boundary: reads the repository and writes only the temporary checkout (`git worktree add`), removed by `dispose`;
 *           runs `git` through the given runner. One service member per Encore app root: a repository with several
 *           generated service apps is refused until they share one root. A repository with none gets `undefined`, and
 *           the caller pushes the source commit as it is.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2: the generated Encore app), ADR 0289 (decision 5: Encore Cloud), ADR 0233
 *                     (package.json imports), STA-136, STA-2155.
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { LINE_CHECKOUT_SETTINGS } from "#node/constants/line-checkout-settings.constant";
import { workspacePackages } from "#node/functions/workspace-packages.function";
import type { EncoreDeployTree } from "#node/types/encore-deploy-tree.type";
import type { EncoreDeployTreeRequest } from "#node/types/encore-deploy-tree-request.type";

/** The generated Encore app file of a service member, from the member root. */
const GENERATED_APP = join(".stackra", "encore", "encore.app");

/** The build outputs a deploy tree carries from each workspace package and the service member. */
const OUTPUTS = ["dist", ".stackra"] as const;

/** The service members with a generated Encore app, relative to the repository. */
function serviceApps(repository: string): string[] {
  const services = join(repository, "services");
  if (!existsSync(services)) return [];
  return readdirSync(services, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(services, entry.name, GENERATED_APP)))
    .map((entry) => join("services", entry.name))
    .toSorted();
}

/** The `paths` of a tsconfig that mirrors a package.json `imports` map. */
function pathsOf(imports: unknown): Record<string, string[]> {
  const paths: Record<string, string[]> = {};
  if (typeof imports !== "object" || imports === null) return paths;
  for (const [key, target] of Object.entries(imports)) {
    const targets = (Array.isArray(target) ? target : [target]).filter(
      (value): value is string => typeof value === "string",
    );
    if (key.startsWith("#") && targets.length > 0) paths[key] = targets;
  }
  return paths;
}

/**
 * Builds the deploy commit of the repository's one generated service app.
 *
 * @param request - the repository, the source commit and the command runner.
 * @returns the deploy tree, or `undefined` when the repository has no generated service app.
 * @throws RunwayInvalidError when more than one service member has a generated Encore app.
 * @example
 * const tree = await encoreDeployTree({ repository: ".", sha, run: runProgram });
 * if (tree !== undefined) await run("git", ["push", "encore://acme", `+${tree.sha}:refs/heads/staging`], {});
 */
export async function encoreDeployTree(
  request: EncoreDeployTreeRequest,
): Promise<EncoreDeployTree | undefined> {
  const { repository, sha, run } = request;
  const apps = serviceApps(repository);
  if (apps.length === 0) return undefined;
  if (apps.length > 1)
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: "providers.encore.app",
        message: `One Encore app root per push: ${apps.join(", ")} each have a generated app; deploy them as one app first`,
      },
    ]);
  const member = apps[0] as string;

  const tree = mkdtempSync(join(tmpdir(), "stackra-encore-"));
  await run("git", ["worktree", "add", "--detach", tree, sha], { cwd: repository });
  const dispose = async (): Promise<void> => {
    rmSync(tree, { recursive: true, force: true });
    await run("git", ["worktree", "prune"], { cwd: repository });
  };
  try {
    const added: string[] = [];
    const folders = [
      member,
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

    const root = join(tree, member);
    copyFileSync(join(root, GENERATED_APP), join(root, "encore.app"));
    const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as Record<
      string,
      unknown
    >;
    const base = existsSync(join(root, "tsconfig.json")) ? "./tsconfig.member.json" : undefined;
    if (base !== undefined)
      renameSync(join(root, "tsconfig.json"), join(root, "tsconfig.member.json"));
    writeFileSync(
      join(root, "tsconfig.json"),
      `${JSON.stringify(
        {
          ...(base === undefined ? {} : { extends: base }),
          compilerOptions: { baseUrl: ".", paths: pathsOf(manifest["imports"]) },
        },
        null,
        2,
      )}\n`,
    );
    added.push(join(member, "encore.app"), join(member, "tsconfig.json"));
    if (base !== undefined) added.push(join(member, "tsconfig.member.json"));

    await run("git", ["add", "--all", "--force", "--", ...added], { cwd: tree });
    await run(
      "git",
      [
        ...LINE_CHECKOUT_SETTINGS.gitIdentity,
        "commit",
        "--quiet",
        "--no-verify",
        "--message",
        `runway: the Encore app of ${member} at ${sha}`,
      ],
      { cwd: tree },
    );
    const deploy = (await run("git", ["rev-parse", "HEAD"], { cwd: tree })).trim();
    return { sha: deploy, member, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}
