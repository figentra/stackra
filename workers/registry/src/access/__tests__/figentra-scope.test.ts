/**
 * Stackra file contract:
 * Purpose: tests of migration 0003 (stackra-215, owner decision D9): the `@figentra` scope row is `internal` and
 *          `commercial`; `figentra/brand` is its trusted publisher (and the @stackra publisher is not); a brand kit
 *          (assets, package.json, LICENSE) publishes and one without a LICENSE is refused; a read with a
 *          non-internal licence is 403 and with an internal licence holding an `@figentra` grant is 200, through
 *          both the in-memory licence port and `D1LicenceCheck` over the real licence tables; the catalogue never
 *          lists a kit.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 6, 10 and 13); ADR 0461 (decision 3).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { activeLicence } from "#src/__tests__/fixtures/memory-bindings.fixture";
import {
  createTestRegistry,
  NOW,
  SETTINGS,
  STACKRA_CLAIMS,
} from "#src/__tests__/fixtures/registry.fixture";
import { readAccess } from "#src/access/read-access";
import type { GithubClaims } from "#src/interfaces/github-claims.interface";
import { D1LicenceCheck } from "#src/licence/d1-licence-check";
import { newLicenceToken } from "#src/licence/new-licence-token";
import { matchPublisher } from "#src/oidc/match-publisher";
import { RegistryStore } from "#src/store/registry-store";

/** The claims of the figentra/brand release workflow (migrations/0003_figentra_brand.sql). */
const BRAND_CLAIMS: GithubClaims = {
  ...STACKRA_CLAIMS,
  repository: "figentra/brand",
  repository_id: "1435586184",
  repository_owner_id: "314302700",
  workflow_ref: "figentra/brand/.github/workflows/release.yml@refs/heads/main",
  environment: "brand-registry",
};

/** A brand kit: package.json plus assets, no src/ and no source maps. */
const KIT = {
  name: "@figentra/brand-academorix",
  version: "1.0.0",
  license: "SEE LICENSE IN LICENSE",
  description: "Academorix brand kit",
};
const KIT_ASSETS = {
  "tokens/colors.json": '{"primary":"#123456"}',
  "logos/mark.svg": "<svg/>",
};

const INTERNAL_GRANT = [{ scope: "@figentra", names: "*" as const }];

describe("migration 0003: the @figentra scope", () => {
  it("seeds @figentra as internal and commercial", async () => {
    const { db } = sqliteD1();
    expect(await new RegistryStore(db).scope("@figentra")).toEqual(
      expect.objectContaining({
        scope: "@figentra",
        read_rule: "internal",
        licence_rule: "commercial",
        commercial_licence: "SEE LICENSE IN LICENSE",
      }),
    );
  });

  it("matches figentra/brand as the trusted publisher, and only it", async () => {
    const { db } = sqliteD1();
    const publishers = await new RegistryStore(db).publishers("@figentra");
    expect(matchPublisher(BRAND_CLAIMS, publishers)).toEqual(
      expect.objectContaining({
        repository: "figentra/brand",
        repository_id: "1435586184",
        repository_owner_id: "314302700",
        workflow: ".github/workflows/release.yml",
        ref: "refs/heads/main",
        environment: "brand-registry",
      }),
    );
    expect(matchPublisher(STACKRA_CLAIMS, publishers)).toBeNull();
    expect(matchPublisher({ ...BRAND_CLAIMS, environment: "release" }, publishers)).toBeNull();
    expect(
      matchPublisher(BRAND_CLAIMS, await new RegistryStore(db).publishers("@stackra")),
    ).toBeNull();
  });

  it("reads through D1: a non-internal licence is 403, an internal one with an @figentra grant is allowed", async () => {
    const { db, sqlite } = sqliteD1();
    const at = NOW.toISOString();
    const customer = await newLicenceToken();
    const internal = await newLicenceToken();
    sqlite.exec(`INSERT INTO licences (id, holder_ref, status, internal, created_at, updated_at) VALUES
      ('lic_c', 'acc_c', 'active', 0, '${at}', '${at}'),
      ('lic_i', 'figentra', 'active', 1, '${at}', '${at}')`);
    sqlite.exec(`INSERT INTO licence_grants (licence_id, scope, name) VALUES
      ('lic_c', '@figentra', '*'), ('lic_i', '@figentra', '*')`);
    sqlite.exec(`INSERT INTO licence_tokens (id, licence_id, hash, label, created_at) VALUES
      ('tok_c', 'lic_c', '${customer.hash}', 'ci', '${at}'),
      ('tok_i', 'lic_i', '${internal.hash}', 'ci', '${at}')`);
    const scope = await new RegistryStore(db).scope("@figentra");
    if (scope === null) throw new Error("@figentra is not seeded");
    const check = new D1LicenceCheck(db);
    const read = (token: string) =>
      readAccess(scope, KIT.name, `Bearer ${token}`, check, SETTINGS, NOW);
    expect(await read(customer.token)).toEqual({
      allowed: false,
      status: 403,
      reason: `${KIT.name} is internal`,
    });
    expect(await read(internal.token)).toEqual(expect.objectContaining({ allowed: true }));
  });
});

describe("brand kits end to end", () => {
  let registry: Awaited<ReturnType<typeof createTestRegistry>>;

  beforeEach(async () => {
    registry = await createTestRegistry();
  });

  const publishKit = (files: Readonly<Record<string, string>>) =>
    registry.publish(KIT, { files, repository: "figentra/brand", claims: BRAND_CLAIMS });

  it("refuses a kit with no LICENSE file (the commercial rule)", async () => {
    const response = await publishKit(KIT_ASSETS);
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toContain(
      "LICENSE file is missing",
    );
  });

  it("publishes a kit, then reads 401 with no token, 403 non-internal, 200 internal", async () => {
    expect((await publishKit({ ...KIT_ASSETS, LICENSE: "Proprietary" })).status).toBe(201);
    registry.licences.licences.set("stkl_customer", activeLicence({ grants: INTERNAL_GRANT }));
    registry.licences.licences.set(
      "stkl_internal",
      activeLicence({ grants: INTERNAL_GRANT, internal: true }),
    );
    expect((await registry.request(`/${KIT.name}`)).status).toBe(401);
    expect((await registry.request(`/${KIT.name}`, { token: "stkl_customer" })).status).toBe(403);
    const packument = await registry.request(`/${KIT.name}`, { token: "stkl_internal" });
    expect(packument.status).toBe(200);
    expect(packument.headers.get("cache-control")).toBe("private, no-store");
    const page = (await (await registry.request("/-/stackra/v1/catalogue")).json()) as {
      items: { name: string }[];
    };
    expect(page.items.map((item) => item.name)).not.toContain(KIT.name);
  });
});
