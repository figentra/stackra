/**
 * Stackra file contract:
 * Purpose: tests of migration 0010: the release workflow of `figentra/testbed` on main, in the `release` environment,
 *          is a trusted publisher of `@figentra` (`@figentra/testbed`, ADR 0522); the same repository from another
 *          ref or environment, a look-alike repository id and the core publisher's claims are not; the earlier
 *          `@figentra` publishers stay trusted.
 * Boundary: test only; D1 is node:sqlite with the real migrations. The row is found by its repository name and the
 *           claims take its repository id, so filling the id into 0010 changes no test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 6 and 10); ADR 0522 (decision 2).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import type { PublisherRow } from "#src/interfaces/publisher-row.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The `@figentra` publishers and the claims of the figentra/testbed release workflow (migrations/0010_figentra_testbed.sql). */
async function testbed(): Promise<{ publishers: PublisherRow[]; claims: GithubClaims }> {
  const { db } = sqliteD1();
  const publishers = await new RegistryStore(db).publishers("@figentra");
  const row = publishers.find((publisher) => publisher.repository === "figentra/testbed");
  if (!row) throw new Error("migration 0010 seeds no figentra/testbed publisher");
  return {
    publishers,
    claims: {
      ...STACKRA_CLAIMS,
      repository: "figentra/testbed",
      repository_id: row.repository_id,
      repository_owner_id: "314302700",
      workflow_ref: "figentra/testbed/.github/workflows/release.yml@refs/heads/main",
      environment: "release",
    },
  };
}

describe("migration 0010: figentra/testbed publishes @figentra", () => {
  it("matches the release workflow on main in the release environment", async () => {
    const { publishers, claims } = await testbed();
    expect(matchPublisher(claims, publishers)).toEqual(
      expect.objectContaining({
        repository: "figentra/testbed",
        repository_owner_id: "314302700",
        workflow: ".github/workflows/release.yml",
        ref: "refs/heads/main",
        environment: "release",
      }),
    );
  });

  it("refuses it from another ref or environment, and a look-alike repository", async () => {
    const { publishers, claims } = await testbed();
    expect(
      matchPublisher(
        {
          ...claims,
          workflow_ref: "figentra/testbed/.github/workflows/release.yml@refs/heads/wave-a",
        },
        publishers,
      ),
    ).toBeNull();
    expect(matchPublisher({ ...claims, environment: "staging" }, publishers)).toBeNull();
    expect(matchPublisher({ ...claims, repository_id: "1" }, publishers)).toBeNull();
    expect(matchPublisher(STACKRA_CLAIMS, publishers)).toBeNull();
  });

  it("keeps the earlier @figentra publishers trusted", async () => {
    const { publishers } = await testbed();
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
