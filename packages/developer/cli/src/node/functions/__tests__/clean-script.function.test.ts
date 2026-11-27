/**
 * Stackra file contract:
 * Purpose: unit tests of `cleanScript`: the script removes folders and files under the shell this system's package
 *          manager uses (sh, or cmd.exe on Windows), a missing path is no error, it never calls `rm`, a path a shell
 *          would read is refused, and the package and service members `stackra new` writes use it.
 * Boundary: test only; runs the script in a throwaway folder in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2899 (portable member scripts).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { cleanScript } from "#node/functions/clean-script.function";
import { packageTemplate } from "#node/functions/package-template.function";
import { serviceTemplate } from "#node/functions/service-template.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-clean-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The `clean` script of the package.json among `files`. */
const cleanOf = (files: readonly { path: string; content: string }[]): string =>
  (
    JSON.parse(files.find((file) => file.path === "package.json")?.content ?? "{}") as {
      scripts: Record<string, string>;
    }
  ).scripts["clean"] ?? "";

describe("cleanScript", () => {
  it("removes folders and files under this system's shell, and a missing one is no error", () => {
    mkdirSync(join(root, "dist", "nested"), { recursive: true });
    writeFileSync(join(root, "dist", "nested", "a.js"), "");
    mkdirSync(join(root, ".turbo"));
    writeFileSync(join(root, "tsconfig.tsbuildinfo"), "");
    // `shell: true` is sh here and cmd.exe on Windows, the shells pnpm runs scripts with.
    const run = spawnSync(cleanScript(["dist", ".turbo", "coverage", "tsconfig.tsbuildinfo"]), {
      cwd: root,
      shell: true,
      encoding: "utf8",
    });
    expect(run.stderr).toBe("");
    expect(run.status).toBe(0);
    expect(existsSync(join(root, "dist"))).toBe(false);
    expect(existsSync(join(root, ".turbo"))).toBe(false);
    expect(existsSync(join(root, "tsconfig.tsbuildinfo"))).toBe(false);
  });

  it("never calls rm", () => {
    expect(cleanScript(["dist"])).not.toMatch(/\brm\b/u);
  });

  it.each([["../up"], ["/abs"], ["a b"], ["$(x)"], ["a;b"], ["."], ["dist/.."]])(
    "refuses %j",
    (path) => {
      expect(() => cleanScript([path])).toThrow(/not a plain relative path/u);
    },
  );

  it("is the clean script of the package and service members stackra new writes", () => {
    const expected = cleanScript(["dist", "coverage", ".turbo", ".stackra"]);
    expect(
      cleanOf(
        packageTemplate({
          name: "demo",
          pascal: "Demo",
          description: "Demo.",
          packageName: "@acme/demo",
          stackraVersion: "workspace:*",
        }),
      ),
    ).toBe(expected);
    expect(
      cleanOf(
        serviceTemplate({
          name: "demo",
          pascal: "Demo",
          description: "Demo.",
          area: "App",
          packageName: "@acme/service-demo",
          stackraVersion: "workspace:*",
        }),
      ),
    ).toBe(expected);
  });
});
