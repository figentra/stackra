/**
 * Stackra file contract:
 * Purpose: unit tests of `easJsonOf` and `toolVersionOf`: the profiles carry the exact node and pnpm pins and a
 *          channel each, the `simulator` profile is a preview Release build for the simulator, the submit profile goes to the Play internal track, the template's other keys stay, a missing
 *          pin keeps the template's, and a major-only node version is refused; `toolVersionOf` reads a mise pin.
 * Boundary: test only; `toolVersionOf` reads a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482; STA-1621.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { easJsonOf } from "#node/functions/eas-json-of.function";
import { toolVersionOf } from "#node/functions/tool-version-of.function";

describe("easJsonOf", () => {
  // @covers sta-1623:FR-007
  // @covers sta-265:FR-004
  it("writes the four build profiles over a base holding the exact pins", () => {
    const json = easJsonOf(
      { build: { base: { node: "24" } }, extra: true },
      { node: "24.22.0", pnpm: "12.6.0", channel: "production" },
    );

    expect(json).toMatchObject({
      extra: true,
      cli: { appVersionSource: "remote" },
      build: {
        base: { node: "24.22.0", pnpm: "12.6.0" },
        development: { extends: "base", developmentClient: true, channel: "development" },
        preview: { extends: "base", channel: "preview" },
        simulator: { extends: "preview", ios: { simulator: true } },
        production: { extends: "base", autoIncrement: true, channel: "production" },
      },
      submit: { production: { android: { track: "internal" } } },
    });
  });

  // @covers sta-1623:FR-007
  it("keeps the template's pin when the product has none, and refuses a major alone", () => {
    expect(
      easJsonOf({ build: { base: { node: "24.22.0" } } }, { channel: "production" }),
    ).toMatchObject({
      build: { base: { node: "24.22.0" } },
    });
    expect(() => easJsonOf({}, { node: "24", channel: "production" })).toThrow(RunwayInvalidError);
  });
});

describe("toolVersionOf", () => {
  it("reads a tool's pin from mise.toml, and nothing without one", () => {
    const repository = mkdtempSync(join(tmpdir(), "tool-version-"));
    try {
      expect(toolVersionOf(repository, "node")).toBeUndefined();
      writeFileSync(
        join(repository, "mise.toml"),
        '[tools]\nnode = "24.22.0" # exact\npnpm = "12.6.0"\n',
      );
      expect(toolVersionOf(repository, "node")).toBe("24.22.0");
      expect(toolVersionOf(repository, "pnpm")).toBe("12.6.0");
    } finally {
      rmSync(repository, { recursive: true, force: true });
    }
  });
});
