/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreDeployTree`: a product with two service members gets one parentless deploy commit at
 *          the repository root that carries every member's gitignored generated outputs and the workspace build
 *          outputs, rewrites each member's `#` imports to relative paths through its own map (the cross-member topic
 *          import of the relay stays), drops `__tests__` folders, writes `encore.app` at the root, and leaves the
 *          working tree untouched; no generated app gives none; two app ids and an unresolvable alias are refused.
 * Boundary: test only; a temporary git repository and the real `git` (`runProgram`), nothing pushed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2); STA-2155; STA-2194.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { encoreDeployTree } from "#node/functions/encore-deploy-tree.function";
import { runProgram } from "#node/functions/run-program.function";

let repository: string;
let sha: string;

/** Runs git in the test repository. */
const git = (...args: string[]): Promise<string> => runProgram("git", args, { cwd: repository });

/** Writes `content` at `path` under the repository, creating its folders. */
function write(path: string, content: string): void {
  const file = join(repository, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

/** One service member's package.json, with the house `imports` map. */
const member = (name: string): string =>
  JSON.stringify({
    name: `@acme/${name}-service`,
    imports: {
      "#modules/*": ["./src/modules/*", "./src/modules/*.ts", "./src/modules/*/index.ts"],
      "#stackra/*": ["./.stackra/gen/*", "./.stackra/gen/*.ts"],
    },
  });

/** The generated Encore app file both members carry. */
const APP = '{ "id": "acme-x1", "lang": "typescript" }\n';

/**
 * A relative path climbing `levels` folders, as the generated Encore files write it. Built, not spelled, so the
 * repository's import check (ADR 0233) does not read this fixture text as the test's own imports.
 */
const up = (levels: number) => "../".repeat(levels);

beforeEach(async () => {
  repository = mkdtempSync(join(tmpdir(), "stackra-encore-tree-"));
  write(".gitignore", ".stackra/\ndist/\nnode_modules/\n");
  for (const name of ["billing", "usage"]) {
    write(`services/${name}/package.json`, member(name));
    write(`services/${name}/src/modules/plans/plan.model.ts`, "export class Plan {}\n");
    write(
      `services/${name}/src/modules/plans/plan.service.ts`,
      'import { Plan } from "#modules/plans/plan.model";\nimport type { Wiring } from "#stackra/wiring";\nexport const plan = new Plan();\n',
    );
    write(`services/${name}/src/modules/plans/__tests__/plan.test.ts`, 'import "vitest";\n');
  }
  write(
    "packages/core/money/package.json",
    JSON.stringify({ name: "@acme/money", version: "1.0.0" }),
  );
  await git("init", "--quiet", "--initial-branch=main");
  await git("add", "--all");
  await git(
    "-c",
    "user.name=t",
    "-c",
    "user.email=t@t.invalid",
    "commit",
    "--quiet",
    "-m",
    "source",
  );
  sha = (await git("rev-parse", "HEAD")).trim();
  // What gen and the build leave behind, gitignored.
  for (const name of ["billing", "usage"]) {
    write(`services/${name}/encore.app`, APP);
    write(`services/${name}/.stackra/gen/wiring.ts`, "export type Wiring = {};\n");
    write(
      `services/${name}/stackra-encore/${name}/api.ts`,
      'import { plan } from "#modules/plans/plan.service";\nexport const api = plan;\n',
    );
    write(`services/${name}/stackra-encore/${name}/events.ts`, "export const topic = 1;\n");
  }
  // The relay imports its producer's topic across members, by a relative path that must survive.
  write(
    "services/usage/stackra-encore/usage/relay.ts",
    `import { topic } from "${up(3)}billing/stackra-encore/billing/events";\nexport const relay = topic;\n`,
  );
  write("packages/core/money/dist/index.js", "export {};\n");
  write("services/usage/node_modules/x/index.js", "skip\n");
});

afterEach(() => rmSync(repository, { recursive: true, force: true }));

describe("encoreDeployTree", () => {
  /** Two members become one app at the root, with every alias rewritten and the tests gone. */
  it("commits every service member as one app at the root, aliases rewritten, tests dropped", async () => {
    const tree = await encoreDeployTree({ repository, sha, run: runProgram });
    expect(tree?.members).toEqual(["services/billing", "services/usage"]);
    const deploy = tree?.sha as string;
    // Parentless, so a shallow checkout can push it; the message names the source commit.
    expect((await git("rev-list", "--parents", "-n", "1", deploy)).trim()).toBe(deploy);
    expect(await git("log", "-1", "--format=%s", deploy)).toContain(sha);

    const files = (await git("ls-tree", "-r", "--name-only", deploy)).split("\n");
    expect(files).toEqual(
      expect.arrayContaining([
        "encore.app",
        "services/billing/stackra-encore/billing/api.ts",
        "services/usage/stackra-encore/usage/relay.ts",
        "services/billing/stackra-encore/billing/events.ts",
        "packages/core/money/dist/index.js",
      ]),
    );
    expect(files.some((file) => file.includes("__tests__"))).toBe(false);
    expect(files.some((file) => file.includes("node_modules"))).toBe(false);
    expect(JSON.parse(await git("show", `${deploy}:encore.app`))).toEqual({
      id: "acme-x1",
      lang: "typescript",
    });

    const show = (path: string) => git("show", `${deploy}:${path}`);
    expect(await show("services/billing/src/modules/plans/plan.service.ts")).toContain(
      `import { Plan } from "./plan.model";\nimport type { Wiring } from "${up(3)}.stackra/gen/wiring";`,
    );
    expect(await show("services/usage/stackra-encore/usage/api.ts")).toContain(
      `from "${up(2)}src/modules/plans/plan.service"`,
    );
    expect(await show("services/usage/stackra-encore/usage/relay.ts")).toContain(
      `from "${up(3)}billing/stackra-encore/billing/events"`,
    );

    await tree?.dispose();
    expect((await git("worktree", "list")).trim().split("\n")).toHaveLength(1);
    expect((await git("status", "--porcelain")).trim()).toBe("");
  });

  /** Without a generated app the caller pushes the source commit itself. */
  it("builds nothing when no service has a generated app", async () => {
    rmSync(join(repository, "services/billing/encore.app"));
    rmSync(join(repository, "services/usage/encore.app"));
    expect(await encoreDeployTree({ repository, sha, run: runProgram })).toBeUndefined();
  });

  /** Members of one product must name one Encore app. */
  it("refuses members whose generated apps name different Encore app ids", async () => {
    write("services/usage/encore.app", '{ "id": "acme-other" }\n');
    await expect(encoreDeployTree({ repository, sha, run: runProgram })).rejects.toThrow(
      RunwayInvalidError,
    );
  });

  /** An alias that resolves nowhere would fail Encore's build later; it fails here, and the checkout is removed. */
  it("refuses an alias no imports entry resolves, and removes the checkout", async () => {
    write(
      "services/billing/stackra-encore/billing/api.ts",
      'import { missing } from "#modules/nowhere/missing";\nexport const api = missing;\n',
    );
    await expect(encoreDeployTree({ repository, sha, run: runProgram })).rejects.toThrow(
      RunwayUnresolvedError,
    );
    expect((await git("worktree", "list")).trim().split("\n")).toHaveLength(1);
  });
});
