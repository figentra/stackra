/**
 * Stackra file contract:
 * Purpose: unit tests of `encoreDeployTree`: a repository with one generated service app gets a deploy commit on its
 *          source commit that carries the gitignored generated outputs, the member's `encore.app` and a tsconfig whose
 *          `paths` mirror the member's `imports`, and the temporary checkout is gone after `dispose`; a repository
 *          with no generated app gets none; one with two is refused.
 * Boundary: test only; a temporary git repository and the real `git` (`runProgram`), nothing pushed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 (decision 2); STA-2155.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
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

beforeEach(async () => {
  repository = mkdtempSync(join(tmpdir(), "stackra-encore-tree-"));
  write(".gitignore", ".stackra/\ndist/\nnode_modules/\n");
  write(
    "services/shop/package.json",
    JSON.stringify({
      name: "@acme/shop-service",
      imports: {
        "#modules/*": ["./src/modules/*", "./src/modules/*.ts"],
        "#assets/*": "./assets/*",
      },
    }),
  );
  write("services/shop/tsconfig.json", '{ "extends": "@stackra/typescript-config/service" }\n');
  write("services/shop/src/main.ts", "export {};\n");
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
});

afterEach(() => rmSync(repository, { recursive: true, force: true }));

describe("encoreDeployTree", () => {
  /** The deploy commit carries what Encore needs and nothing of it reaches the working tree. */
  it("commits the generated app, encore.app and the path map on the source commit", async () => {
    write(
      "services/shop/.stackra/encore/encore.app",
      '{ "id": "acme-x1", "lang": "typescript" }\n',
    );
    write("services/shop/.stackra/encore/shop/encore.service.ts", "export {};\n");
    write("services/shop/.stackra/entry/server.ts", "export {};\n");
    write("packages/core/money/dist/index.js", "export {};\n");
    write("services/shop/node_modules/x/index.js", "skip\n");

    const tree = await encoreDeployTree({ repository, sha, run: runProgram });
    expect(tree?.member).toBe("services/shop");
    const deploy = tree?.sha as string;
    expect((await git("rev-parse", `${deploy}^`)).trim()).toBe(sha);
    const files = (await git("ls-tree", "-r", "--name-only", deploy)).split("\n");
    expect(files).toEqual(
      expect.arrayContaining([
        "services/shop/encore.app",
        "services/shop/tsconfig.json",
        "services/shop/tsconfig.member.json",
        "services/shop/.stackra/encore/shop/encore.service.ts",
        "services/shop/.stackra/entry/server.ts",
        "packages/core/money/dist/index.js",
      ]),
    );
    expect(files.some((file) => file.includes("node_modules"))).toBe(false);
    expect(JSON.parse(await git("show", `${deploy}:services/shop/encore.app`))).toEqual({
      id: "acme-x1",
      lang: "typescript",
    });
    expect(JSON.parse(await git("show", `${deploy}:services/shop/tsconfig.json`))).toEqual({
      extends: "./tsconfig.member.json",
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "#modules/*": ["./src/modules/*", "./src/modules/*.ts"],
          "#assets/*": ["./assets/*"],
        },
      },
    });

    await tree?.dispose();
    expect((await git("worktree", "list")).trim().split("\n")).toHaveLength(1);
    expect((await git("status", "--porcelain")).trim()).toBe("");
  });

  /** Without a generated app the caller pushes the source commit itself. */
  it("builds nothing when no service has a generated app", async () => {
    expect(await encoreDeployTree({ repository, sha, run: runProgram })).toBeUndefined();
  });

  /** Two service apps would need one app root, which is not built yet. */
  it("refuses two generated service apps", async () => {
    write("services/shop/.stackra/encore/encore.app", "{}\n");
    write("services/billing/package.json", "{}\n");
    write("services/billing/.stackra/encore/encore.app", "{}\n");
    await expect(encoreDeployTree({ repository, sha, run: runProgram })).rejects.toThrow(
      RunwayInvalidError,
    );
  });
});
