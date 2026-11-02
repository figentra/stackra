/**
 * Stackra file contract:
 * Purpose: unit tests of `checkPublish`: the kinds and their naming, both licence rules (commercial, with sources
 *          allowed only in an internal scope; open-source with NOTICE), version and name mismatches, semver, and the
 *          client digests.
 * Boundary: pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 7 and 11).
 */
import type { ScopeRow } from "#src/interfaces/scope-row.interface";
import type { PublishCandidate } from "#src/interfaces/publish-candidate.interface";
import { checkPublish } from "#src/publish/check-publish";

const OPEN: ScopeRow = {
  scope: "@stackra",
  read_rule: "open",
  licence_rule: "open-source",
  commercial_licence: "SEE LICENSE IN LICENSE",
};
const PRO: ScopeRow = {
  ...OPEN,
  scope: "@stackra-pro",
  read_rule: "licensed",
  licence_rule: "commercial",
};
const DIGESTS = { integrity: "sha512-x", shasum: "abc", sha256: "def", sha512: "fed" };

const candidate = (
  pkg: Record<string, unknown>,
  overrides: Partial<PublishCandidate> = {},
): PublishCandidate => ({
  name: "@stackra/core",
  version: "1.0.0",
  scope: OPEN,
  contents: {
    files: ["package.json"],
    packageJson: { name: "@stackra/core", version: "1.0.0", license: "MIT", ...pkg },
  },
  digests: DIGESTS,
  clientDist: { integrity: "sha512-x", shasum: "abc" },
  ...overrides,
});

describe("checkPublish", () => {
  it("passes an MIT package", () => {
    expect(checkPublish(candidate({}))).toEqual({ ok: true, kind: "package" });
  });

  it("reads stackra.kind and its naming rule", () => {
    const skill = candidate(
      { name: "@stackra/skill-archify", stackra: { kind: "skill" } },
      { name: "@stackra/skill-archify" },
    );
    expect(checkPublish(skill)).toEqual({ ok: true, kind: "skill" });
    expect(checkPublish(candidate({ stackra: { kind: "skill" } }))).toEqual({
      ok: false,
      reasons: ["a skill item is named @stackra/skill-<name>"],
    });
    expect(checkPublish(candidate({ stackra: { kind: "theme" } })).ok).toBe(false);
  });

  it("names a contract and a docs item with a -<kind> suffix, not a prefix", () => {
    for (const kind of ["contract", "docs"]) {
      const name = `@stackra/billing-${kind}`;
      expect(checkPublish(candidate({ name, stackra: { kind } }, { name }))).toEqual({
        ok: true,
        kind,
      });
      const prefixed = `@stackra/${kind}-billing`;
      expect(
        checkPublish(candidate({ name: prefixed, stackra: { kind } }, { name: prefixed })),
      ).toEqual({
        ok: false,
        reasons: [`a ${kind} item is named @stackra/<name>-${kind}`],
      });
    }
    const suffixedSkill = "@stackra/archify-skill";
    expect(
      checkPublish(
        candidate({ name: suffixedSkill, stackra: { kind: "skill" } }, { name: suffixedSkill }),
      ),
    ).toEqual({ ok: false, reasons: ["a skill item is named @stackra/skill-<name>"] });
  });

  it("refuses name, version, semver and digest mismatches", () => {
    const verdict = checkPublish(
      candidate(
        { name: "@stackra/other", version: "v1" },
        { version: "v1", clientDist: { integrity: "sha512-y", shasum: "abc" } },
      ),
    );
    expect(verdict).toEqual({
      ok: false,
      reasons: [
        "package.json name is not @stackra/core",
        "v1 is not a semver version",
        "dist.integrity differs from the tarball",
      ],
    });
  });

  it("allows another open-source licence with a NOTICE", () => {
    const files = ["package.json", "NOTICE"];
    const pkg = { name: "@stackra/core", version: "1.0.0", license: "Apache-2.0" };
    expect(checkPublish(candidate(pkg, { contents: { files, packageJson: pkg } })).ok).toBe(true);
    expect(checkPublish(candidate({ license: "Apache-2.0" })).ok).toBe(false);
    expect(checkPublish(candidate({ license: "UNLICENSED" })).ok).toBe(false);
  });

  it("applies the commercial rule", () => {
    const pkg = { name: "@stackra-pro/sync", version: "1.0.0", license: "SEE LICENSE IN LICENSE" };
    const pro = (files: string[]) =>
      checkPublish(
        candidate(pkg, {
          name: "@stackra-pro/sync",
          scope: PRO,
          contents: { files, packageJson: pkg },
        }),
      );
    expect(pro(["package.json", "LICENSE", "dist/index.mjs"]).ok).toBe(true);
    expect(pro(["package.json", "LICENSE", "src/index.ts", "dist/index.mjs.map"])).toEqual({
      ok: false,
      reasons: ["src/ must not be published", "source maps must not be published"],
    });
    expect(pro(["package.json"])).toEqual({ ok: false, reasons: ["LICENSE file is missing"] });
  });

  it("lets an internal commercial scope ship sources and maps, and nothing else", () => {
    const FIGENTRA: ScopeRow = { ...PRO, scope: "@figentra", read_rule: "internal" };
    const pkg = {
      name: "@figentra/os-mobile",
      version: "3.0.0",
      license: "SEE LICENSE IN LICENSE",
    };
    const line = (files: string[], packageJson: Record<string, unknown> = pkg) =>
      checkPublish(
        candidate(packageJson, {
          name: "@figentra/os-mobile",
          version: "3.0.0",
          scope: FIGENTRA,
          contents: { files, packageJson },
        }),
      );
    expect(line(["package.json", "LICENSE", "src/main.ts", "dist/index.mjs.map"])).toEqual({
      ok: true,
      kind: "package",
    });
    expect(line(["package.json", "src/main.ts"], { ...pkg, license: "UNLICENSED" })).toEqual({
      ok: false,
      reasons: [
        '@figentra packages must name the licence "SEE LICENSE IN LICENSE"',
        "LICENSE file is missing",
      ],
    });
  });
});
