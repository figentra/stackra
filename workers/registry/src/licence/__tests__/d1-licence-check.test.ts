/**
 * Stackra file contract:
 * Purpose: unit tests of the D1 licence read side: `newLicenceToken` (`stkl_` and 43 base64url characters, its hash),
 *          `grantsOf` (rows folded per scope, `*` wins) and `D1LicenceCheck` (a live token answers its licence, grants
 *          and internal flag; an unknown, revoked or non-`stkl_` token is null; a suspended licence still answers, so
 *          the read rule can say why).
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 13); ADR 0461 (decision 3).
 */
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { sha256Hex } from "#src/bytes/sha256-hex";
import { D1LicenceCheck } from "#src/licence/d1-licence-check";
import { grantsOf } from "#src/licence/grants-of";
import { newLicenceToken } from "#src/licence/new-licence-token";

const AT = "2026-10-27T00:00:00.000Z";

describe("newLicenceToken", () => {
  it("makes a stkl_ token of 32 random bytes and its SHA-256", async () => {
    const one = await newLicenceToken();
    const two = await newLicenceToken();
    expect(one.token).toMatch(/^stkl_[A-Za-z0-9_-]{43}$/);
    expect(one.hash).toBe(await sha256Hex(one.token));
    expect(one.token).not.toBe(two.token);
  });
});

describe("grantsOf", () => {
  it("folds rows per scope, sorted, `*` covering the scope", () => {
    expect(
      grantsOf([
        { scope: "@stackra-pro", name: "@stackra-pro/sync" },
        { scope: "@b", name: "*" },
        { scope: "@stackra-pro", name: "@stackra-pro/builder-studio" },
        { scope: "@b", name: "@b/x" },
      ]),
    ).toEqual([
      { scope: "@b", names: "*" },
      { scope: "@stackra-pro", names: ["@stackra-pro/builder-studio", "@stackra-pro/sync"] },
    ]);
    expect(grantsOf([])).toEqual([]);
  });
});

describe("D1LicenceCheck", () => {
  it("answers the licence of a live token and null otherwise", async () => {
    const { db, sqlite } = sqliteD1();
    const live = await newLicenceToken();
    const revoked = await newLicenceToken();
    sqlite.exec(`INSERT INTO licences (id, holder_ref, status, internal, not_before, expires_at, created_at, updated_at)
      VALUES ('lic_1', 'acc_1', 'suspended', 1, NULL, '2027-01-01T00:00:00.000Z', '${AT}', '${AT}')`);
    sqlite.exec(
      `INSERT INTO licence_grants (licence_id, scope, name) VALUES ('lic_1', '@stackra-pro', '*')`,
    );
    sqlite.exec(`INSERT INTO licence_tokens (id, licence_id, hash, label, created_at, revoked_at) VALUES
      ('tok_1', 'lic_1', '${live.hash}', 'ci', '${AT}', NULL),
      ('tok_2', 'lic_1', '${revoked.hash}', 'old', '${AT}', '${AT}')`);
    const check = new D1LicenceCheck(db);
    expect(await check.check(live.token)).toEqual({
      licenceId: "lic_1",
      tokenId: "tok_1",
      holder: "acc_1",
      status: "suspended",
      notBefore: null,
      expiresAt: "2027-01-01T00:00:00.000Z",
      grants: [{ scope: "@stackra-pro", names: "*" }],
      internal: true,
    });
    expect(await check.check(revoked.token)).toBeNull();
    expect(await check.check("stkl_unknown")).toBeNull();
    expect(await check.check("stkp_not-a-licence-token")).toBeNull();
  });
});
