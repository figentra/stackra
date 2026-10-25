/**
 * Stackra file contract:
 * Purpose: unit tests of `readMember`: the layout from each `define*` call, an app's targets from its manifest, the
 *          docs and tooling layouts without `stackra.config.ts`, and the refusal of a config with no `define*` call.
 * Boundary: test only; writes throwaway members in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decisions 1 and 2).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { readMember } from "#node/functions/read-member.function";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const config = (call: string) =>
  writeFileSync(
    join(root, "stackra.config.ts"),
    `import { ${call} } from "@stackra/contracts";\nexport default ${call}({});\n`,
  );

describe("readMember", () => {
  it.each([
    ["definePackage", "package"],
    ["defineService", "service"],
    ["defineWorker", "worker"],
  ])("reads %s as a %s", (call, layout) => {
    config(call);
    expect(readMember(root)).toEqual({ root, layout, targets: [] });
  });

  it("reads an app's targets from its committed manifest", () => {
    config("defineApp");
    writeFileSync(
      join(root, "stackra.manifest.json"),
      JSON.stringify({
        member: "web",
        package: "@acme/web",
        version: "1",
        targets: ["web", "pwa"],
      }),
    );
    expect(readMember(root)).toEqual({ root, layout: "app", targets: ["web", "pwa"] });
  });

  it("has no targets for an app gen has not run on", () => {
    config("defineApp");
    expect(readMember(root).targets).toEqual([]);
  });

  it("is docs with src/docs.json and no stackra.config.ts, tooling otherwise", () => {
    expect(readMember(root).layout).toBe("tooling");
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "src", "docs.json"), "{}");
    expect(readMember(root).layout).toBe("docs");
  });

  it("refuses a stackra.config.ts without a define call", () => {
    writeFileSync(join(root, "stackra.config.ts"), "export default {};\n");
    expect(() => readMember(root)).toThrow(/calls no defineApp/);
  });
});
