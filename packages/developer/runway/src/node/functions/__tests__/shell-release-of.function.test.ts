/**
 * Stackra file contract:
 * Purpose: unit tests of `shellReleaseOf`: a checked-out shell's `dist/shell.json` becomes the edge release with its
 *          entry and import map under the asset store's versioned shell path; a missing manifest, a path that climbs
 *          out of `dist/` and a manifest of another surface, major or version are refused.
 * Boundary: test only; a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4); ADR 0481.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { shellReleaseOf } from "#node/functions/shell-release-of.function";
import type { LineCheckout } from "#node/types/line-checkout.type";

let dir: string;
let checkout: LineCheckout;

/** Writes `dist/shell.json` with `overrides`. */
function writeManifest(overrides: Record<string, unknown> = {}): void {
  mkdirSync(join(dir, "dist"), { recursive: true });
  writeFileSync(
    join(dir, "dist/shell.json"),
    JSON.stringify({
      surface: "console",
      line: "3",
      version: "3.1.0",
      entry: "assets/main.abc123.js",
      css: ["assets/main.def456.css"],
      importMap: { imports: { react: "shared/react.1a.js", "react/": "shared/react/" } },
      ...overrides,
    }),
  );
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "stackra-shell-"));
  checkout = {
    line: "os/console@3",
    major: "3",
    name: "console",
    package: "@figentra/os-console",
    version: "3.1.0",
    from: "local",
    dir,
    steps: [],
  };
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("shellReleaseOf", () => {
  it("answers the release with URLs under the versioned shell path", () => {
    writeManifest();
    expect(shellReleaseOf(checkout, "https://assets.example.com/")).toEqual({
      version: "3.1.0",
      entry: "https://assets.example.com/shells/console/3/3.1.0/assets/main.abc123.js",
      importMap: {
        imports: {
          react: "https://assets.example.com/shells/console/3/3.1.0/shared/react.1a.js",
          "react/": "https://assets.example.com/shells/console/3/3.1.0/shared/react/",
        },
      },
    });
  });

  it("refuses a missing manifest, a path out of dist and another surface, major or version", () => {
    expect(() => shellReleaseOf(checkout, "https://a")).toThrow(RunwayInvalidError);
    writeManifest({ entry: "../main.js" });
    expect(() => shellReleaseOf(checkout, "https://a")).toThrow(RunwayInvalidError);
    writeManifest({ surface: "landing", line: "1", version: "1.0.0" });
    try {
      shellReleaseOf(checkout, "https://a");
      throw new Error("expected a RunwayInvalidError");
    } catch (error) {
      expect((error as RunwayInvalidError).issues.map((issue) => issue.path)).toEqual([
        "surface",
        "line",
        "version",
      ]);
    }
  });
});
