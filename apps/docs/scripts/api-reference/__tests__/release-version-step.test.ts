/**
 * Stackra file contract:
 * Purpose: the release version step regenerates the API reference. Every reference page and the package index print
 *          each package's `version`, and `pnpm validate` checks the pages, so the changesets bot's version script
 *          (`changeset:version` in the root package.json, run by runway-npm.yml) must rewrite them after the bump, or
 *          every "chore(release): version packages" PR fails validate.
 * Boundary: test only; reads the root package.json.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0025 (automation prepares the release); STA-2857.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { REGENERATE_COMMAND } from "../regenerate-command.constant";

/** The root package.json's scripts. */
const scripts = (
  JSON.parse(
    readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../package.json"),
      "utf8",
    ),
  ) as { readonly scripts: Readonly<Record<string, string>> }
).scripts;

describe("the release version step", () => {
  it("regenerates the API reference after the version bump and gen", () => {
    const steps = (scripts["changeset:version"] ?? "").split("&&").map((step) => step.trim());
    const bump = steps.indexOf("changeset version");
    const regenerate = steps.indexOf(REGENERATE_COMMAND);
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(regenerate).toBe(steps.length - 1);
    expect(regenerate).toBeGreaterThan(bump);
  });
});
