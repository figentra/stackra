/**
 * Stackra file contract:
 * Purpose: tests of migration 0017: after the move to the stackra-inc organization (STA-2806), the release workflows
 *          of `stackra-inc/stackra` and `stackra-inc/stackra-pro` publish `@stackra` and `@stackra-pro`, and the
 *          old `figentra/*` names and owner id no longer do, even with the same repository id.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 6).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { PRO_CLAIMS, STACKRA_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The same workflow as it was named before the move. */
const figentraNamed = (claims: GithubClaims): GithubClaims => {
  const repository = claims.repository.replace("stackra-inc/", "figentra/");
  return {
    ...claims,
    repository,
    repository_owner_id: "314302700",
    workflow_ref: `${repository}/.github/workflows/release.yml@refs/heads/main`,
  };
};

describe("migration 0017: the Stackra scopes publish from stackra-inc", () => {
  it("matches stackra-inc/stackra for @stackra and stackra-inc/stackra-pro for @stackra-pro", async () => {
    const { db } = sqliteD1();
    const store = new RegistryStore(db);
    expect(matchPublisher(STACKRA_CLAIMS, await store.publishers("@stackra"))).toEqual(
      expect.objectContaining({
        repository: "stackra-inc/stackra",
        repository_owner_id: "277548342",
      }),
    );
    expect(matchPublisher(PRO_CLAIMS, await store.publishers("@stackra-pro"))).toEqual(
      expect.objectContaining({
        repository: "stackra-inc/stackra-pro",
        repository_owner_id: "277548342",
      }),
    );
  });

  it("refuses the old figentra names and owner id, and each repository for the other scope", async () => {
    const { db } = sqliteD1();
    const store = new RegistryStore(db);
    expect(
      matchPublisher(figentraNamed(STACKRA_CLAIMS), await store.publishers("@stackra")),
    ).toBeNull();
    expect(
      matchPublisher(figentraNamed(PRO_CLAIMS), await store.publishers("@stackra-pro")),
    ).toBeNull();
    expect(matchPublisher(PRO_CLAIMS, await store.publishers("@stackra"))).toBeNull();
    expect(matchPublisher(STACKRA_CLAIMS, await store.publishers("@stackra-pro"))).toBeNull();
  });
});
