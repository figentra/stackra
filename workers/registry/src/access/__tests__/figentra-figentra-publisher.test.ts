/**
 * Stackra file contract:
 * Purpose: tests of migration 0011: `figentra/figentra`'s release workflow on main, in the `release` environment,
 *          is a trusted publisher of `@figentra` (it publishes `@figentra/cli`); the same repository from another
 *          ref or environment, another repository with the same name but a different id, and the core publisher's
 *          claims are not; figentra/brand, figentra/commerce and figentra/os stay trusted.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 6 and 10); ADR 0500 (decisions 1 to 3).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The claims of the figentra/figentra release workflow (migrations/0011_figentra_figentra.sql). */
const FIGENTRA_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/figentra",
  repository_id: "1435864013",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/figentra/.github/workflows/release.yml@refs/heads/main",
  environment: "release",
};

describe("migration 0011: figentra/figentra publishes @figentra", () => {
  it("matches the figentra release workflow on main in the release environment", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(matchPublisher(FIGENTRA_CLAIMS, publishers)).toEqual(
      expect.objectContaining({
        repository: "figentra/figentra",
        repository_id: "1435864013",
        workflow: ".github/workflows/release.yml",
        ref: "refs/heads/main",
        environment: "release",
      }),
    );
  });

  it("refuses figentra/figentra from another ref or environment, and a look-alike repository", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(
      matchPublisher(
        {
          ...FIGENTRA_CLAIMS,
          workflow_ref: "figentra/figentra/.github/workflows/release.yml@refs/heads/wave-a",
        },
        publishers,
      ),
    ).toBeNull();
    expect(matchPublisher({ ...FIGENTRA_CLAIMS, environment: "staging" }, publishers)).toBeNull();
    expect(matchPublisher({ ...FIGENTRA_CLAIMS, repository_id: "1" }, publishers)).toBeNull();
    expect(matchPublisher(STACKRA_CLAIMS, publishers)).toBeNull();
  });

  it("keeps every other @figentra publisher trusted", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(publishers.map((row) => row.repository)).toEqual(
      expect.arrayContaining([
        "figentra/billing",
        "figentra/brand",
        "figentra/commerce",
        "figentra/figentra",
        "figentra/invoicing",
        "figentra/os",
        "figentra/pay",
        "figentra/testbed",
      ]),
    );
  });
});
