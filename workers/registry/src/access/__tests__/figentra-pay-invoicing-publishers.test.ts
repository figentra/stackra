/**
 * Stackra file contract:
 * Purpose: tests of migration 0008: the release workflows of `figentra/pay` and `figentra/invoicing` on main, in the
 *          `release` environment, are trusted publishers of `@figentra` (their service contracts, ADR 0511); the
 *          same repositories from another ref or environment, a look-alike repository id and the core publisher's
 *          claims are not; the earlier `@figentra` publishers stay trusted.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 6 and 10); ADR 0511 (decisions 4 and 5).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The claims of the figentra/pay release workflow (migrations/0008_figentra_pay_invoicing.sql). */
const PAY_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/pay",
  repository_id: "1435861177",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/pay/.github/workflows/release.yml@refs/heads/main",
  environment: "release",
};

/** The claims of the figentra/invoicing release workflow (migrations/0008_figentra_pay_invoicing.sql). */
const INVOICING_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/invoicing",
  repository_id: "1440593616",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/invoicing/.github/workflows/release.yml@refs/heads/main",
  environment: "release",
};

describe("migration 0008: figentra/pay and figentra/invoicing publish @figentra", () => {
  it("matches each release workflow on main in the release environment", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    for (const claims of [PAY_CLAIMS, INVOICING_CLAIMS])
      expect(matchPublisher(claims, publishers)).toEqual(
        expect.objectContaining({
          repository: claims.repository,
          repository_id: claims.repository_id,
          workflow: ".github/workflows/release.yml",
          ref: "refs/heads/main",
          environment: "release",
        }),
      );
  });

  it("refuses them from another ref or environment, and a look-alike repository", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    for (const claims of [PAY_CLAIMS, INVOICING_CLAIMS]) {
      expect(
        matchPublisher(
          {
            ...claims,
            workflow_ref: `${claims.repository}/.github/workflows/release.yml@refs/heads/wave-a`,
          },
          publishers,
        ),
      ).toBeNull();
      expect(matchPublisher({ ...claims, environment: "staging" }, publishers)).toBeNull();
      expect(matchPublisher({ ...claims, repository_id: "1" }, publishers)).toBeNull();
    }
    expect(matchPublisher(STACKRA_CLAIMS, publishers)).toBeNull();
  });

  it("keeps the earlier @figentra publishers trusted", async () => {
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
