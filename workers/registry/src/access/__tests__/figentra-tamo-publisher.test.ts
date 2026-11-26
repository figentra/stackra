/**
 * Stackra file contract:
 * Purpose: tests of migration 0016: the release workflow of `figentra/tamo` on main, in the `release` environment, is a
 *          trusted publisher of `@figentra` (its service contracts, ADR 0511: `@figentra/tamo-service-tamo-contract`
 *          got 403 at the OIDC exchange without it); the same repository from another ref or environment, a look-alike
 *          repository id and the core publisher's claims are not; the earlier `@figentra` publishers stay trusted.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 6 and 10); ADR 0511 (decisions 4 and 5).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The claims of the figentra/tamo release workflow (migrations/0016_figentra_tamo.sql). */
const TAMO_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/tamo",
  repository_id: "1435861386",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/tamo/.github/workflows/release.yml@refs/heads/main",
  environment: "release",
};

describe("migration 0016: figentra/tamo publishes @figentra", () => {
  it("matches the release workflow on main in the release environment", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(matchPublisher(TAMO_CLAIMS, publishers)).toEqual(
      expect.objectContaining({
        repository: "figentra/tamo",
        repository_id: "1435861386",
        workflow: ".github/workflows/release.yml",
        ref: "refs/heads/main",
        environment: "release",
      }),
    );
  });

  it("refuses it from another ref or environment, and a look-alike repository", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(
      matchPublisher(
        {
          ...TAMO_CLAIMS,
          workflow_ref: "figentra/tamo/.github/workflows/release.yml@refs/heads/wave-a",
        },
        publishers,
      ),
    ).toBeNull();
    expect(matchPublisher({ ...TAMO_CLAIMS, environment: "staging" }, publishers)).toBeNull();
    expect(matchPublisher({ ...TAMO_CLAIMS, repository_id: "1" }, publishers)).toBeNull();
    expect(matchPublisher(STACKRA_CLAIMS, publishers)).toBeNull();
  });

  it("keeps the earlier @figentra publishers trusted", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(publishers.map((row) => row.repository)).toEqual(
      expect.arrayContaining([
        "figentra/tamo",
        "figentra/brand",
        "figentra/commerce",
        "figentra/figentra",
        "figentra/invoicing",
        "figentra/os",
        "figentra/pay",
        "figentra/testbed",
        "figentra/billing",
      ]),
    );
  });
});
