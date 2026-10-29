/**
 * Stackra file contract:
 * Purpose: tests of migration 0004: `figentra/commerce`'s release workflow on main, in the `release` environment, is
 *          a trusted publisher of `@figentra`; the same repository from another ref or environment, another
 *          repository with the same name but a different id, and the brand publisher's claims for commerce are not;
 *          figentra/brand stays trusted.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 6).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The claims of the figentra/commerce release workflow (migrations/0004_figentra_commerce.sql). */
const COMMERCE_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/commerce",
  repository_id: "1432717046",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/commerce/.github/workflows/release.yml@refs/heads/main",
  environment: "release",
};

describe("migration 0004: figentra/commerce publishes @figentra", () => {
  it("matches the commerce release workflow on main in the release environment", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(matchPublisher(COMMERCE_CLAIMS, publishers)).toEqual(
      expect.objectContaining({
        repository: "figentra/commerce",
        repository_id: "1432717046",
        workflow: ".github/workflows/release.yml",
        ref: "refs/heads/main",
        environment: "release",
      }),
    );
  });

  it("refuses commerce from another ref or environment, and a look-alike repository", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(
      matchPublisher(
        {
          ...COMMERCE_CLAIMS,
          workflow_ref: "figentra/commerce/.github/workflows/release.yml@refs/heads/wave-a",
        },
        publishers,
      ),
    ).toBeNull();
    expect(matchPublisher({ ...COMMERCE_CLAIMS, environment: "staging" }, publishers)).toBeNull();
    expect(matchPublisher({ ...COMMERCE_CLAIMS, repository_id: "1" }, publishers)).toBeNull();
    expect(matchPublisher(STACKRA_CLAIMS, publishers)).toBeNull();
  });

  it("keeps figentra/brand trusted", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(publishers.map((row) => row.repository).sort()).toEqual([
      "figentra/brand",
      "figentra/commerce",
    ]);
  });
});
