/**
 * Stackra file contract:
 * Purpose: guards the tarball of @stackra/repo-checks: the spec checks it publishes carry nothing of core's Linear
 *          workflow, so a product repository can run them. Scans the files `package.json` lists under `src` and `dist`
 *          (tests excluded) for `linear.mjs` and `pnpm linear`, and the `spec-*` files also for a `STA-<n>` key.
 * Boundary: test only; reads the package's own files.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 3: published checks); ADR 0022 (test placement).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

const ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

/** Every file under `path`, tests and dependencies left out. */
function walk(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.name === "__tests__" || entry.name === "node_modules"
      ? []
      : entry.isDirectory()
        ? walk(join(path, entry.name))
        : [join(path, entry.name)],
  );
}

/** The published source and build files: the `src` and `dist` entries of `files`. */
function published(): string[] {
  const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    files: string[];
  };
  return manifest.files
    .filter((f) => f === "src" || f === "dist")
    .flatMap((f) => walk(join(ROOT, f)));
}

describe("published files of @stackra/repo-checks", () => {
  it("publish source", () => {
    expect(published().length).toBeGreaterThan(0);
  });

  it("hold no Linear script or `pnpm linear` call", () => {
    const offenders = published().filter((f) =>
      /linear\.mjs|pnpm (?:--silent )?linear/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("keep the spec checks free of a `STA-<n>` key", () => {
    const offenders = published()
      .filter((f) => basename(f).startsWith("spec-"))
      .filter((f) => /\bSTA-\d/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
