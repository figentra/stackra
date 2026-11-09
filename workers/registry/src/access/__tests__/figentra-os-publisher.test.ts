/**
 * Stackra file contract:
 * Purpose: tests of migration 0006: `figentra/os`'s release workflow on main, in the `release` environment, is
 *          a trusted publisher of `@figentra`; the same repository from another ref or environment, another
 *          repository with the same name but a different id, and the core publisher's claims are not;
 *          figentra/brand and figentra/commerce stay trusted.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 6 and 10); ADR 0481.
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The claims of the figentra/os release workflow (migrations/0006_figentra_os.sql). */
const OS_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/os",
  repository_id: "1427748269",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/os/.github/workflows/release.yml@refs/heads/main",
  environment: "release",
};

describe("migration 0006: figentra/os publishes @figentra", () => {
  it("matches the OS release workflow on main in the release environment", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(matchPublisher(OS_CLAIMS, publishers)).toEqual(
      expect.objectContaining({
        repository: "figentra/os",
        repository_id: "1427748269",
        workflow: ".github/workflows/release.yml",
        ref: "refs/heads/main",
        environment: "release",
      }),
    );
  });

  it("refuses OS from another ref or environment, and a look-alike repository", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(
      matchPublisher(
        {
          ...OS_CLAIMS,
          workflow_ref: "figentra/os/.github/workflows/release.yml@refs/heads/wave-a",
        },
        publishers,
      ),
    ).toBeNull();
    expect(matchPublisher({ ...OS_CLAIMS, environment: "staging" }, publishers)).toBeNull();
    expect(matchPublisher({ ...OS_CLAIMS, repository_id: "1" }, publishers)).toBeNull();
    expect(matchPublisher(STACKRA_CLAIMS, publishers)).toBeNull();
  });

  it("keeps figentra/brand and figentra/commerce trusted", async () => {
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
