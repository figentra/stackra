/**
 * Stackra file contract:
 * Purpose: tests of migration 0005: `@figentra-oss` is an `open` scope with the `open-source` licence rule, and
 *          `figentra/flow`'s release workflow on main, in the `release` environment, is its only trusted publisher;
 *          the same repository from another ref or environment, a look-alike repository id and another scope's
 *          publisher are not; figentra/flow publishes nothing to `@figentra`.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 6 and 10; amendment of 2026-10-31).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The claims of the figentra/flow release workflow (migrations/0005_figentra_oss.sql). */
const FLOW_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/flow",
  repository_id: "1432855858",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/flow/.github/workflows/release.yml@refs/heads/main",
  environment: "release",
};

describe("migration 0005: the @figentra-oss scope, published by figentra/flow", () => {
  it("is an open scope with the open-source licence rule", async () => {
    const { db } = sqliteD1();
    const row = await db
      .prepare("SELECT read_rule, licence_rule FROM scopes WHERE scope = ?")
      .bind("@figentra-oss")
      .first();
    expect(row).toEqual({ read_rule: "open", licence_rule: "open-source" });
  });

  it("trusts only the flow release workflow on main in the release environment", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra-oss");
    expect(publishers.map((row) => row.repository)).toEqual(["figentra/flow"]);
    expect(matchPublisher(FLOW_CLAIMS, publishers)).toEqual(
      expect.objectContaining({ repository: "figentra/flow", environment: "release" }),
    );
    expect(
      matchPublisher(
        {
          ...FLOW_CLAIMS,
          workflow_ref: "figentra/flow/.github/workflows/release.yml@refs/heads/x",
        },
        publishers,
      ),
    ).toBeNull();
    expect(matchPublisher({ ...FLOW_CLAIMS, environment: "staging" }, publishers)).toBeNull();
    expect(matchPublisher({ ...FLOW_CLAIMS, repository_id: "1" }, publishers)).toBeNull();
    expect(matchPublisher(STACKRA_CLAIMS, publishers)).toBeNull();
  });

  it("does not let figentra/flow publish to @figentra", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(matchPublisher(FLOW_CLAIMS, publishers)).toBeNull();
  });
});
