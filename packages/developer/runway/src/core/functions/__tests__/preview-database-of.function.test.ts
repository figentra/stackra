/**
 * Stackra file contract:
 * Purpose: unit tests of `previewDatabaseOf`: a runway without a preview database block gets a fresh database with the
 *          `demo` seed profile, a named profile is kept, `from: branch` gives a Neon branch named after the git branch
 *          (slugged, 63 characters at most) of the default or named parent; a branch source without its Neon block, an
 *          unknown profile and a branch name with no letter or digit are refused.
 * Boundary: test only; roots are built through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0238 (decision 1), ADR 0190.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunway } from "#core/functions/parse-runway.function";
import { previewDatabaseOf } from "#core/functions/preview-database-of.function";
import type { RootRunway } from "#core/types/root-runway.type";

/** A root runway whose preview environment declares `database`. */
function rootWith(database?: Record<string, unknown>): RootRunway {
  return parseRunway("root", {
    version: 3,
    project: "acme",
    environments: { preview: database === undefined ? {} : { shared: { database } } },
  });
}

describe("previewDatabaseOf", () => {
  it("seeds a fresh database with the demo profile by default", () => {
    expect(previewDatabaseOf(rootWith(), "feat/checkout")).toEqual({
      from: "seed-pack",
      profile: "demo",
    });
    expect(previewDatabaseOf(rootWith({ profile: "test" }), "feat/checkout")).toEqual({
      from: "seed-pack",
      profile: "test",
    });
  });

  it("branches from Neon under a name taken from the git branch", () => {
    const root = rootWith({ from: "branch", branch: { provider: "neon", project: "acme-db" } });
    expect(previewDatabaseOf(root, "Feat/Checkout_Flow")).toEqual({
      from: "branch",
      provider: "neon",
      project: "acme-db",
      parent: "main",
      name: "preview-feat-checkout-flow",
    });
    const named = rootWith({
      from: "branch",
      branch: { provider: "neon", project: "acme-db", parent: "staging" },
    });
    const long = previewDatabaseOf(named, `feat/${"a".repeat(80)}`);
    expect(long).toMatchObject({ parent: "staging" });
    expect(long.from === "branch" && long.name.length).toBe(63);
  });

  it("refuses a branch source without its Neon block, an unknown profile and an unnamed branch", () => {
    expect(() => previewDatabaseOf(rootWith({ from: "branch" }), "feat/x")).toThrow(
      /environments\.preview\.shared\.database\.branch/,
    );
    expect(() => previewDatabaseOf(rootWith({ profile: "full" }), "feat/x")).toThrow(
      RunwayInvalidError,
    );
    const root = rootWith({ from: "branch", branch: { provider: "neon", project: "acme-db" } });
    expect(() => previewDatabaseOf(root, "///")).toThrow(RunwayInvalidError);
  });
});
