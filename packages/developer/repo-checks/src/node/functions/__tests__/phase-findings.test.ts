/**
 * Stackra file contract:
 * Purpose: unit tests of the phase runners over a temporary repository: `configFindings`, `catalogueFindings`,
 *          `docsFindings` and `structureFindings` (with `listMembers` replaced, so no pnpm runs), and
 *          `readRepoContext` over a fresh git repository.
 * Boundary: test only; writes a temporary folder and runs `git init` there.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3); ADR 0022 (test placement).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { catalogueFindings } from "#node/functions/catalogue-findings.function";
import { configFindings } from "#node/functions/config-findings.function";
import { docsFindings } from "#node/functions/docs-findings.function";
import { readRepoContext } from "#node/functions/read-repo-context.function";
import { structureFindings } from "#node/functions/structure-findings.function";

vi.mock("#node/functions/list-members.function", () => ({
  listMembers: (root: string) => [
    { name: "root", dir: "", path: root },
    { name: "@stackra/demo", dir: "packages/data/demo", path: join(root, "packages/data/demo") },
  ],
}));

/** A double quote, kept out of the import-shaped string below. */
const Q = '"';

/** A temporary repository holding `files` (path to text). */
function repo(files: Record<string, string>): { root: string; files: string[] } {
  const root = mkdtempSync(join(tmpdir(), "repo-checks-"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return { root, files: Object.keys(files) };
}

describe("phase runners", () => {
  it("configFindings reports JSON configs, flow maps and the .gitignore line", () => {
    const context = repo({
      ".gitignore": "node_modules\n",
      "tools/x.json": "{}",
      "lefthook.yml": "a: { b: c }\n",
    });
    expect(configFindings(context).map((f) => f.rule)).toEqual([
      "json-configs",
      "yaml-flow-maps",
      "gitignore-stackra",
    ]);
  });

  it("configFindings reads a scaffold template as it renders: `port: {{PORT}}` is no flow map there", () => {
    const yaml = "environments:\n  dev:\n    port: {{PORT}}\n";
    const context = repo({
      ".gitignore": ".stackra/\n",
      "tools/scaffold/templates/apps/docs/runway.yaml": yaml,
      "apps/docs/runway.yaml": yaml,
    });
    // Unrendered, `{{PORT}}` is two nested flow maps.
    const flowMap =
      "apps/docs/runway.yaml:3: flow mapping; write a block mapping (YAML standard, STA-299)";
    expect(configFindings(context).map((f) => f.text)).toEqual([flowMap, flowMap]);
  });

  it("catalogueFindings and docsFindings read the listed files", () => {
    const context = repo({
      "packages/data/demo/assets/lang/fr/a.json": '{ "x": "y" }',
      "packages/data/demo/src/core/a.ts": "export const a = 1;\n",
    });
    expect(catalogueFindings(context)).toEqual([
      {
        rule: "catalogues",
        dir: "",
        text: "packages/data/demo/assets/lang: no en catalogue, the source every locale is checked against",
      },
    ]);
    expect(docsFindings(context).map((f) => f.text)).toEqual([
      "packages/data/demo/src/core/a.ts:1: missing the Stackra file contract header before the imports (ADR 0007)",
      "packages/data/demo/src/core/a.ts:1: export const a has no TSDoc block (ADR 0007)",
    ]);
  });

  it("structureFindings checks files and every member", async () => {
    const context = repo({
      "package.json": '{ "name": "root" }',
      LICENSE: "L",
      "packages/data/demo/package.json":
        '{ "name": "@stackra/wrong", "dependencies": { "x": "^1" } }',
      "packages/data/demo/src/a.test.ts": "",
      // Built with Q so this file's own source holds no import the check would flag.
      "packages/data/demo/src/core/b.ts": `import { c } from ${Q}../../c${Q};\n`,
    });
    const warn = vi.fn();
    const rules = (await structureFindings(context, { ci: false, warn })).map(
      (f) => `${f.rule} ${f.dir}`,
    );
    expect(rules).toContain("test-placement ");
    expect(rules).toContain("imports ");
    expect(rules).toContain("member packages/data/demo");
    expect(rules).toContain("member-files packages/data/demo");
    expect(warn).not.toHaveBeenCalled();
  });

  it("readRepoContext lists tracked and untracked files that are not ignored", () => {
    const { root } = repo({ ".gitignore": "ignored.txt\n", "a.txt": "a", "ignored.txt": "i" });
    execFileSync("git", ["init", "-q"], { cwd: root });
    expect([...readRepoContext(root).files].sort()).toEqual([".gitignore", "a.txt"]);
  });
});
