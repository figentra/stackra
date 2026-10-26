/**
 * Stackra file contract:
 * Purpose: unit tests of `runBrandKit`: help and usage errors, `check` passing and failing a kit with exit codes 0 and
 *          1, and `generate` refusing an output folder inside the kit with exit code 1 and no stack.
 * Boundary: test only; kit folders in the system temporary folder, output collected in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { runBrandKit } from "#node/functions/run-brand-kit.function";
import { makeKitFolder } from "#node/functions/__tests__/fixtures/kit-folder.fixture";

/** Runs a command line and collects what it wrote. */
async function run(argv: string[]) {
  let out = "";
  let err = "";
  const code = await runBrandKit(argv, {
    out: (text) => void (out += text),
    err: (text) => void (err += text),
  });
  return { code, out, err };
}

describe("runBrandKit", () => {
  it("prints help", async () => {
    const { code, out } = await run(["--help"]);
    expect(code).toBe(0);
    expect(out).toContain("brand-kit generate <kit> --out <dir>");
  });

  it("refuses an unknown command, an unknown option and generate without --out", async () => {
    expect((await run(["paint"])).code).toBe(2);
    expect((await run(["check", "--colour"])).code).toBe(2);
    expect((await run(["generate", "assets/brand"])).code).toBe(2);
  });

  it("checks a kit", async () => {
    const { kit } = makeKitFolder("acme");
    const { code, out } = await run(["check", kit]);
    expect(code).toBe(0);
    expect(out).toContain("ok  acme");
  });

  it("fails a kit with problems", async () => {
    const { kit } = makeKitFolder("acme", { "logos/word.svg": "<svg><text>acme</text></svg>" });
    const { code, out } = await run(["check", kit]);
    expect(code).toBe(1);
    expect(out).toContain("FAIL  acme");
    expect(out).toContain("logos/word.svg: live <text> in a logo file (outline it)");
  });

  it("refuses an output folder inside the kit", async () => {
    const { kit } = makeKitFolder("acme");
    const { code, err } = await run(["generate", kit, "--out", join(kit, "generated")]);
    expect(code).toBe(1);
    expect(err).toContain("is inside the kit");
  });
});
