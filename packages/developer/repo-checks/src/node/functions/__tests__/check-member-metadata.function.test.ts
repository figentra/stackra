/**
 * Stackra file contract:
 * Purpose: unit tests of `checkMemberMetadata`, `npmMetadataFor` and `turboTagsFor`: a complete package, app and
 *          service pass; each missing or wrong field, a folder mismatch, a copied summary, tags that differ from the
 *          runtimes and a schema refusal are findings; the root has none.
 * Boundary: test only; pure functions, no disk. The schema is a stand-in with `safeParse`, as the built one is.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 11, amendment of 2026-10-27).
 */
import { describe, expect, it } from "vitest";

import { checkMemberMetadata } from "#node/functions/check-member-metadata.function";
import { npmMetadataFor } from "#node/functions/npm-metadata-for.function";
import { turboTagsFor } from "#node/functions/turbo-tags-for.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

/** A complete member at `dir` with this `stackra` field. */
function member(
  dir: string,
  stackra: NonNullable<PackageManifest["stackra"]>,
  keywords: readonly string[],
): { dir: string; pkg: PackageManifest; turbo: { tags: string[] } } {
  return {
    dir,
    pkg: {
      name: "x",
      description: "Stores files.",
      keywords,
      ...npmMetadataFor(dir),
      stackra,
    },
    turbo: {
      tags: turboTagsFor({
        tier: stackra.tier ?? "",
        category: stackra.category,
        runtimes: stackra.runtimes ?? [],
      }),
    },
  };
}

const storage = member(
  "packages/data/storage",
  {
    kind: "package",
    tier: "lib",
    category: "data",
    runtimes: ["isomorphic", "node"],
    summary: "Reach for it to keep files on a disk or a bucket.",
  },
  ["stackra", "data", "storage", "files"],
);

describe("checkMemberMetadata", () => {
  it("passes a complete package, app and service, and skips the root", () => {
    expect(checkMemberMetadata(storage)).toEqual([]);
    const app = member(
      "workers/static",
      { kind: "package", tier: "app", runtimes: ["worker"], summary: "Serves static files." },
      ["stackra", "cloudflare"],
    );
    expect(checkMemberMetadata(app)).toEqual([]);
    const service = member(
      "services/health",
      {
        kind: "package",
        tier: "service",
        runtimes: ["node"],
        summary: "Probe it.",
        module: "./src/health.module.ts",
      },
      ["stackra", "health"],
    );
    expect(checkMemberMetadata(service)).toEqual([]);
    expect(checkMemberMetadata({ dir: "", pkg: {} })).toEqual([]);
  });

  it("finds each missing npm field", () => {
    const findings = checkMemberMetadata({ ...storage, pkg: { stackra: storage.pkg.stackra } });
    expect(findings).toEqual([
      'keywords must list "stackra" and "data", then the member\'s domain terms',
      `repository must be ${JSON.stringify(npmMetadataFor(storage.dir).repository)}`,
      'homepage must be "https://github.com/figentra/stackra/tree/main/packages/data/storage#readme"',
      'bugs must be {"url":"https://github.com/figentra/stackra/issues"}',
      'author must be "Figentra (https://figentra.com)"',
      'engines.node must be ">=24.0.0", as the root package.json',
    ]);
  });

  it("requires the kind written out", () => {
    expect(
      checkMemberMetadata({ ...storage, pkg: { ...storage.pkg, stackra: undefined } }),
    ).toEqual(['stackra.kind must be written out as "package" (ADR 0453 decision 11)']);
  });

  it("finds a folder mismatch, missing runtimes and summary, a copied summary and drifted tags", () => {
    const pkg = storage.pkg;
    const field = pkg.stackra ?? {};
    expect(
      checkMemberMetadata({
        ...storage,
        pkg: { ...pkg, stackra: { ...field, tier: "app", category: "state" } },
      }),
    ).toEqual([
      'stackra.tier must be "lib", the tier of packages/data/storage',
      'stackra.category must be "data", its packages/<category> folder',
    ]);
    expect(
      checkMemberMetadata({
        ...storage,
        pkg: { ...pkg, stackra: { kind: "package", tier: "lib", category: "data" } },
      }),
    ).toEqual([
      "stackra.runtimes must list where its entries run, from their Runtime: headers",
      "stackra.summary missing: one sentence for agents on when to reach for this member",
      'turbo.jsonc tags must be ["tier:lib","category:data"], from the stackra field',
    ]);
    expect(
      checkMemberMetadata({
        ...storage,
        pkg: { ...pkg, stackra: { ...field, summary: " Stores files. " } },
        turbo: { tags: ["tier:lib"] },
      }),
    ).toEqual([
      "stackra.summary copies description: say when to reach for this member instead",
      'turbo.jsonc tags must be ["tier:lib","category:data","runtime:isomorphic","runtime:node"], from the stackra field',
    ]);
  });

  it("refuses a category outside packages and reports the schema's issues", () => {
    const app = member(
      "apps/console",
      { kind: "package", tier: "app", category: "data", runtimes: ["browser"], summary: "A UI." },
      ["stackra"],
    );
    expect(checkMemberMetadata(app)).toEqual([
      "stackra.category is for packages only; remove it",
      'turbo.jsonc tags must be ["tier:app","runtime:browser"], from the stackra field',
    ]);
    const schema = {
      safeParse: () => ({
        success: false,
        error: { issues: [{ path: ["runtimes", 0], message: "Invalid option" }] },
      }),
    };
    expect(checkMemberMetadata({ ...storage, schema })).toEqual([
      "stackra.runtimes.0: Invalid option (STACKRA_MANIFEST_SCHEMA)",
    ]);
  });
});
