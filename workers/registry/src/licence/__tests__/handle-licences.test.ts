/**
 * Stackra file contract:
 * Purpose: end-to-end tests of the licence API (ADR 0453 decision 14) and of its tokens on the read path through the
 *          real `D1LicenceCheck`: issuer token (401), Idempotency-Key (required, replay without the token, 409 on
 *          another request), issue with a first token, the token reading `@stackra-pro` and nothing past its grants,
 *          renew, set grants (422 for a scope that is not `licensed`), suspend and resume, revoke (final, 409 after),
 *          the token maximum, revoking one token, the audit rows, and the `internal` name `@stackra-pro/ui` (ADR 0461
 *          decision 3) refused to a customer `*` grant, read by an internal licence and hidden from the catalogue.
 * Boundary: test only; D1 is node:sqlite with the real migrations, everything else in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 13 and 14); ADR 0461 (decision 3).
 */
import type { RegistryLicence } from "@stackra/licensing/contracts";

import { createTestRegistry, HOST, PRO_CLAIMS } from "#src/__tests__/fixtures/registry.fixture";
import { sha256Hex } from "#src/bytes/sha256-hex";
import { handleRequest } from "#src/http/handle-request";
import { D1LicenceCheck } from "#src/licence/d1-licence-check";

const ISSUER = "stki_test-issuer-token";
const PRO_FILES = { LICENSE: "commercial", "dist/index.mjs": "export {};" };
const pro = (name: string) => ({
  name,
  version: "0.1.0",
  license: "SEE LICENSE IN LICENSE",
  description: name,
});

type Registry = Awaited<ReturnType<typeof createTestRegistry>>;

/** The registry with the real D1 licence check and one issuer token. */
async function setUp() {
  const registry = await createTestRegistry();
  registry.sqlite
    .prepare("INSERT INTO issuer_tokens (hash, label, created_at) VALUES (?, 'os-billing', ?)")
    .run(await sha256Hex(ISSUER), "2026-10-27T00:00:00.000Z");
  const deps = { ...registry.deps, licences: new D1LicenceCheck(registry.db) };
  const send = (
    method: string,
    path: string,
    init: { token?: string | null; key?: string | null; body?: unknown } = {},
  ): Promise<Response> => {
    const headers = new Headers();
    const token = init.token === undefined ? ISSUER : init.token;
    if (token !== null) headers.set("authorization", `Bearer ${token}`);
    const key = init.key === undefined ? crypto.randomUUID() : init.key;
    if (key !== null) headers.set("idempotency-key", key);
    return handleRequest(
      new Request(`https://${HOST}${path}`, {
        method,
        headers,
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      }),
      deps,
    );
  };
  for (const name of ["@stackra-pro/sync", "@stackra-pro/ui", "@stackra-pro/search-advanced"])
    await registry.publish(pro(name), {
      files: PRO_FILES,
      repository: "figentra/stackra-pro",
      claims: PRO_CLAIMS,
    });
  /** A read of `/<path>` (a name, or a tarball path) with a licence token, through the D1 licence check. */
  const read = (path: string, token: string | null): Promise<Response> =>
    send("GET", `/${path}`, { token, key: null });
  return { registry, send, read };
}

const ISSUE = {
  holderRef: "acc_01",
  grants: [{ scope: "@stackra-pro", names: ["@stackra-pro/sync"] }],
  notBefore: null,
  expiresAt: "2027-10-27T00:00:00.000Z",
  tokenLabel: "github-actions",
};

const licenceOf = async (response: Response): Promise<RegistryLicence> =>
  (await response.json()) as RegistryLicence;

describe("licence API", () => {
  let registry: Registry;
  let send: Awaited<ReturnType<typeof setUp>>["send"];
  let read: Awaited<ReturnType<typeof setUp>>["read"];

  beforeEach(async () => {
    ({ registry, send, read } = await setUp());
  });

  it("needs an issuer token and an Idempotency-Key", async () => {
    expect(
      (await send("POST", "/-/stackra/v1/licences", { token: null, body: ISSUE })).status,
    ).toBe(401);
    expect(
      (await send("POST", "/-/stackra/v1/licences", { token: "stki_wrong", body: ISSUE })).status,
    ).toBe(401);
    expect((await send("POST", "/-/stackra/v1/licences", { key: null, body: ISSUE })).status).toBe(
      400,
    );
    expect((await send("GET", "/-/stackra/v1/licences")).status).toBe(405);
    expect((await send("POST", "/-/stackra/v1/licences/lic_x/nope")).status).toBe(404);
  });

  it("issues a licence with a first token that reads its grants only", async () => {
    const response = await send("POST", "/-/stackra/v1/licences", { body: ISSUE });
    expect(response.status).toBe(201);
    const licence = await licenceOf(response);
    expect(licence).toEqual(
      expect.objectContaining({
        holderRef: "acc_01",
        status: "active",
        grants: [{ scope: "@stackra-pro", names: ["@stackra-pro/sync"] }],
        expiresAt: "2027-10-27T00:00:00.000Z",
      }),
    );
    expect(licence.issuedToken).toMatch(/^stkl_[A-Za-z0-9_-]{43}$/);
    expect(licence.tokens).toEqual([
      expect.objectContaining({ label: "github-actions", revokedAt: null }),
    ]);
    const token = licence.issuedToken ?? "";
    expect(registry.sqlite.prepare("SELECT hash FROM licence_tokens").all()).toEqual([
      { hash: await sha256Hex(token) },
    ]);
    expect((await read("@stackra-pro/sync", token)).status).toBe(200);
    expect((await read("@stackra-pro/search-advanced", token)).status).toBe(403);
  });

  it("replays a key without the token and refuses it for another request", async () => {
    const first = await licenceOf(
      await send("POST", "/-/stackra/v1/licences", { key: "evt_1", body: ISSUE }),
    );
    const again = await send("POST", "/-/stackra/v1/licences", { key: "evt_1", body: ISSUE });
    expect(again.status).toBe(201);
    expect(again.headers.get("idempotent-replayed")).toBe("true");
    expect(await licenceOf(again)).toEqual({ ...first, issuedToken: null });
    expect(registry.sqlite.prepare("SELECT COUNT(*) AS n FROM licences").get()).toEqual({ n: 1 });
    const other = await send("POST", "/-/stackra/v1/licences", {
      key: "evt_1",
      body: { ...ISSUE, holderRef: "acc_02" },
    });
    expect(other.status).toBe(409);
  });

  it("validates the body and refuses a grant on a scope that is not licensed", async () => {
    const issue = (body: unknown) => send("POST", "/-/stackra/v1/licences", { body });
    expect((await issue({ ...ISSUE, holderRef: "" })).status).toBe(400);
    expect((await issue({ ...ISSUE, expiresAt: "soon" })).status).toBe(400);
    expect(
      (await issue({ ...ISSUE, grants: [{ scope: "@stackra-pro", names: ["@stackra/core"] }] }))
        .status,
    ).toBe(400);
    expect((await issue({ ...ISSUE, grants: [{ scope: "@stackra", names: "*" }] })).status).toBe(
      422,
    );
    expect((await issue({ ...ISSUE, grants: [{ scope: "@nobody", names: "*" }] })).status).toBe(
      422,
    );
  });

  it("renews, sets grants, suspends, resumes and revokes", async () => {
    const licence = await licenceOf(await send("POST", "/-/stackra/v1/licences", { body: ISSUE }));
    const token = licence.issuedToken ?? "";
    const path = `/-/stackra/v1/licences/${licence.id}`;

    const renewed = await licenceOf(
      await send("PATCH", path, { body: { expiresAt: "2028-01-01T00:00:00Z" } }),
    );
    expect(renewed.expiresAt).toBe("2028-01-01T00:00:00.000Z");
    const widened = await licenceOf(
      await send("PATCH", path, { body: { grants: [{ scope: "@stackra-pro", names: "*" }] } }),
    );
    expect(widened.grants).toEqual([{ scope: "@stackra-pro", names: "*" }]);
    expect((await read("@stackra-pro/search-advanced", token)).status).toBe(200);

    expect((await licenceOf(await send("POST", `${path}/suspend`))).status).toBe("suspended");
    expect((await read("@stackra-pro/sync", token)).status).toBe(403);
    expect((await licenceOf(await send("POST", `${path}/resume`))).status).toBe("active");
    expect((await read("@stackra-pro/sync", token)).status).toBe(200);

    expect((await licenceOf(await send("POST", `${path}/revoke`))).status).toBe("revoked");
    expect((await read("@stackra-pro/sync", token)).status).toBe(403);
    expect((await send("POST", `${path}/resume`)).status).toBe(409);
    expect((await send("PATCH", path, { body: { expiresAt: null } })).status).toBe(409);
    expect((await send("POST", "/-/stackra/v1/licences/lic_none/suspend")).status).toBe(404);

    expect(
      registry.sqlite
        .prepare(
          "SELECT action, name, actor FROM audit_events WHERE action LIKE 'licence.%' ORDER BY id",
        )
        .all()
        .map((row) => row.action),
    ).toEqual([
      "licence.issue",
      "licence.patch",
      "licence.patch",
      "licence.suspend",
      "licence.resume",
      "licence.revoke",
    ]);
  });

  it("caps live tokens at REGISTRY_LICENCE_MAX_TOKENS and revokes one token", async () => {
    const licence = await licenceOf(
      await send("POST", "/-/stackra/v1/licences", { body: { ...ISSUE, tokenLabel: null } }),
    );
    expect(licence.issuedToken).toBeNull();
    const path = `/-/stackra/v1/licences/${licence.id}/tokens`;
    let last: RegistryLicence = licence;
    for (let index = 0; index < registry.deps.settings.licenceMaxTokens; index += 1)
      last = await licenceOf(await send("POST", path, { body: { label: `ci-${index}` } }));
    expect((await send("POST", path, { body: { label: "one-more" } })).status).toBe(422);

    const [first] = last.tokens;
    const revoked = await licenceOf(await send("DELETE", `${path}/${first?.id}`));
    expect(revoked.tokens.find((token) => token.id === first?.id)?.revokedAt).toBe(
      registry.deps.now().toISOString(),
    );
    expect((await send("DELETE", `${path}/tok_none`)).status).toBe(404);
    expect((await send("POST", path, { body: { label: "replacement" } })).status).toBe(201);
  });

  it("keeps @stackra-pro/ui internal: no customer grant reads it and the catalogue hides it", async () => {
    const customer = await licenceOf(
      await send("POST", "/-/stackra/v1/licences", {
        body: { ...ISSUE, grants: [{ scope: "@stackra-pro", names: "*" }] },
      }),
    );
    const named = await licenceOf(
      await send("POST", "/-/stackra/v1/licences", {
        body: { ...ISSUE, grants: [{ scope: "@stackra-pro", names: ["@stackra-pro/ui"] }] },
      }),
    );
    expect((await read("@stackra-pro/ui", customer.issuedToken)).status).toBe(403);
    expect((await read("@stackra-pro/ui", named.issuedToken)).status).toBe(403);
    expect((await read("@stackra-pro/sync", customer.issuedToken)).status).toBe(200);

    const figentra = await licenceOf(
      await send("POST", "/-/stackra/v1/licences", {
        body: { ...ISSUE, holderRef: "figentra", grants: [{ scope: "@stackra-pro", names: "*" }] },
      }),
    );
    // Only the owner makes a licence internal (README "Internal licences"); the API cannot.
    registry.sqlite.prepare("UPDATE licences SET internal = 1 WHERE id = ?").run(figentra.id);
    expect((await read("@stackra-pro/ui", figentra.issuedToken)).status).toBe(200);
    expect((await read("@stackra-pro/ui/-/ui-0.1.0.tgz", figentra.issuedToken)).status).toBe(200);
    expect((await read("@stackra-pro/ui/-/ui-0.1.0.tgz", customer.issuedToken)).status).toBe(403);

    const page = (await (
      await registry.request("/-/stackra/v1/catalogue?scope=@stackra-pro")
    ).json()) as {
      items: { name: string }[];
    };
    expect(page.items.map((item) => item.name)).not.toContain("@stackra-pro/ui");
    expect((await registry.request("/-/stackra/v1/catalogue/@stackra-pro/ui")).status).toBe(404);
  });
});
