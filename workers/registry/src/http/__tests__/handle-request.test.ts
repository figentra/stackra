/**
 * Stackra file contract:
 * Purpose: end-to-end tests of the registry over fakes (ADR 0453 decisions 4 to 12): the OIDC exchange, publish and
 *          its refusals, packuments (full, abbreviated, KV cached and dropped), versions, tarballs and their cache
 *          headers, signatures against /-/npm/v1/keys, attestations, dist-tags, deprecation, the refused routes, the
 *          scope read rules through the licence port, whoami and the catalogue API.
 * Boundary: test only; D1 is node:sqlite with the real migrations, everything else in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (Enforcement).
 */
import { createPublicKey, verify } from "node:crypto";

import { activeLicence } from "#src/__tests__/fixtures/memory-bindings.fixture";
import {
  createTestRegistry,
  PRO_CLAIMS,
  publishBody,
  STACKRA_CLAIMS,
} from "#src/__tests__/fixtures/registry.fixture";

const CORE = { name: "@stackra/core", version: "0.1.0", license: "MIT", description: "Core" };
const PRO = {
  name: "@stackra-pro/sync",
  version: "0.1.0",
  license: "SEE LICENSE IN LICENSE",
  description: "Sync",
};
const PRO_FILES = { LICENSE: "commercial", "dist/index.mjs": "export {};" };

type Registry = Awaited<ReturnType<typeof createTestRegistry>>;

// oxlint-disable-next-line typescript/no-explicit-any -- the tests read deep npm JSON shapes by path
type Json = any;

const body = async (response: Response): Promise<Json> => (await response.json()) as Json;

/** The OIDC exchange for `@stackra/core` with the trusted publisher's claims changed by `claims`. */
const exchangeAs = async (registry: Registry, claims: object): Promise<Response> =>
  registry.request("/-/npm/v1/oidc/token/exchange/package/@stackra%2fcore", {
    method: "POST",
    token: await registry.idToken({ ...STACKRA_CLAIMS, ...claims }),
  });

describe("handleRequest", () => {
  let registry: Registry;

  beforeEach(async () => {
    registry = await createTestRegistry();
  });

  describe("fixed routes", () => {
    it("answers ping", async () => {
      const response = await registry.request("/-/ping");
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({});
    });

    it("refuses npm login with the licence docs", async () => {
      const response = await registry.request("/-/user/org.couchdb.user:me", {
        method: "PUT",
        body: {},
      });
      expect(response.status).toBe(403);
      expect((await body(response)).error).toContain("https://docs.stackra.figentra.com/licensing");
    });

    it("answers 404 for search, audit and unscoped names, and never proxies", async () => {
      for (const path of ["/-/v1/search?text=x", "/-/npm/v1/security/advisories/bulk", "/lodash"])
        expect((await registry.request(path)).status).toBe(404);
      expect((await registry.request("/@stackra/unknown")).status).toBe(404);
      expect((await registry.request("/@other/thing")).status).toBe(404);
      expect(registry.fetches).toEqual([]);
    });

    it("lists the signing key in npm's shape", async () => {
      const { keys } = await body(await registry.request("/-/npm/v1/keys"));
      expect(keys).toEqual([
        expect.objectContaining({
          expires: null,
          keytype: "ecdsa-sha2-nistp256",
          scheme: "ecdsa-sha2-nistp256",
          keyid: expect.stringMatching(/^SHA256:[A-Za-z0-9+/]{43}$/),
        }),
      ]);
    });
  });

  describe("OIDC exchange", () => {
    it("issues a 15-minute publish token bound to one name and stores its hash only", async () => {
      const token = await registry.publishToken("@stackra/core");
      expect(token).toMatch(/^stkp_[A-Za-z0-9_-]{43}$/);
      const rows = registry.sqlite.prepare("SELECT * FROM publish_tokens").all();
      expect(rows).toEqual([
        expect.objectContaining({
          name: "@stackra/core",
          repository: "figentra/stackra",
          expires_at: "2026-10-27T12:15:00.000Z",
          run: "https://github.com/figentra/stackra/actions/runs/42/attempts/1",
        }),
      ]);
      expect(JSON.stringify(rows)).not.toContain(token);
      expect(registry.fetches).toEqual([
        "https://token.actions.githubusercontent.com/.well-known/jwks",
      ]);
    });

    it("refuses a workflow that is not the scope's trusted publisher", async () => {
      expect((await exchangeAs(registry, { repository_id: "999" })).status).toBe(403);
      expect((await exchangeAs(registry, { repository_owner_id: "1" })).status).toBe(403);
      expect((await exchangeAs(registry, { environment: "preview" })).status).toBe(403);
      expect(
        (
          await exchangeAs(registry, {
            workflow_ref: "figentra/stackra/.github/workflows/ci.yml@refs/heads/main",
          })
        ).status,
      ).toBe(403);
      // The pro publisher cannot publish @stackra, and the reverse.
      expect((await exchangeAs(registry, PRO_CLAIMS)).status).toBe(403);
    });

    it("refuses a token with a wrong audience, issuer or expiry", async () => {
      for (const claims of [
        { aud: "npm:registry.npmjs.org" },
        { iss: "https://example.com" },
        { exp: 1 },
      ]) {
        const response = await registry.request(
          "/-/npm/v1/oidc/token/exchange/package/@stackra%2fcore",
          { method: "POST", token: await registry.idToken({ ...STACKRA_CLAIMS, ...claims }) },
        );
        expect(response.status).toBe(401);
      }
    });
  });

  describe("publish", () => {
    it("publishes, signs and serves a version", async () => {
      const published = await registry.publish(CORE);
      expect(published.status).toBe(201);

      const packument = await body(await registry.request("/@stackra%2fcore"));
      expect(packument["dist-tags"]).toEqual({ latest: "0.1.0" });
      const dist = packument.versions["0.1.0"].dist;
      expect(dist.tarball).toBe("https://npm.stackra.figentra.com/@stackra/core/-/core-0.1.0.tgz");
      expect(dist.integrity).toMatch(/^sha512-/);
      expect(dist.attestations.provenance.predicateType).toBe("https://slsa.dev/provenance/v1");

      const [{ keyid, sig }] = dist.signatures;
      const { keys } = await body(await registry.request("/-/npm/v1/keys"));
      const key = keys.find((entry: { keyid: string }) => entry.keyid === keyid);
      const publicKey = createPublicKey({
        key: Buffer.from(key.key, "base64"),
        format: "der",
        type: "spki",
      });
      const message = Buffer.from(`@stackra/core@0.1.0:${dist.integrity}`);
      expect(verify("sha256", message, publicKey, Buffer.from(sig, "base64"))).toBe(true);

      const audit = registry.sqlite
        .prepare("SELECT action, name, version, actor FROM audit_events")
        .all();
      expect(audit.map((row) => row.action)).toEqual(["token.exchange", "publish"]);
    });

    it("serves the tarball with immutable caching for an open scope and counts the download", async () => {
      await registry.publish(CORE);
      const response = await registry.request("/@stackra/core/-/core-0.1.0.tgz");
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
      expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
      await Promise.all(registry.deferred);
      expect(registry.sqlite.prepare("SELECT * FROM downloads_daily").all()).toEqual([
        { day: "2026-10-27", name: "@stackra/core", licence_id: "", count: 1 },
      ]);
    });

    it("accepts a base64 provenance attachment as well as npm's JSON text", async () => {
      expect((await registry.publish(CORE, { provenanceEncoding: "base64" })).status).toBe(201);
    });

    it("refuses an existing version", async () => {
      await registry.publish(CORE);
      expect((await registry.publish(CORE)).status).toBe(409);
    });

    it("refuses a token bound to another name", async () => {
      const token = await registry.publishToken("@stackra/core");
      const response = await registry.request("/@stackra%2fother", {
        method: "PUT",
        token,
        body: await publishBody({ ...CORE, name: "@stackra/other" }),
      });
      expect(response.status).toBe(403);
    });

    it("refuses a publish without a token", async () => {
      const response = await registry.request("/@stackra%2fcore", {
        method: "PUT",
        body: await publishBody(CORE),
      });
      expect(response.status).toBe(401);
    });

    it.each([
      ["a name mismatch", CORE, {}, "@stackra/other"],
      ["a missing provenance bundle", CORE, { provenance: false }, null],
      ["an integrity mismatch", CORE, { integrity: "sha512-AAAA" }, null],
      ["an unknown kind", { ...CORE, stackra: { kind: "theme" } }, {}, null],
      ["a non-MIT licence without NOTICE", { ...CORE, license: "Apache-2.0" }, {}, null],
      [
        "the commercial licence in @stackra",
        { ...CORE, license: "SEE LICENSE IN LICENSE" },
        {},
        null,
      ],
    ] as const)("refuses %s", async (_label, pkg, options, requestName) => {
      const name = requestName ?? pkg.name;
      const token = await registry.publishToken(name);
      const response = await registry.request(`/${name.replace("/", "%2f")}`, {
        method: "PUT",
        token,
        body: await publishBody(pkg, options),
      });
      expect(response.status).toBe(400);
    });

    it("refuses a non-package item not named <kind>-<name>", async () => {
      const response = await registry.publish({ ...CORE, stackra: { kind: "skill" } });
      expect(response.status).toBe(400);
      expect((await body(response)).error).toContain("@stackra/skill-<name>");
    });

    it("refuses a tarball over the size limit", async () => {
      Object.assign(registry.deps, {
        settings: { ...registry.deps.settings, maxTarballBytes: 10 },
      });
      expect((await registry.publish(CORE)).status).toBe(413);
    });

    it("applies the commercial rules to @stackra-pro", async () => {
      expect(
        (
          await registry.publish(PRO, {
            files: { "dist/index.mjs": "" },
            repository: "figentra/stackra-pro",
            claims: PRO_CLAIMS,
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await registry.publish(PRO, {
            files: { ...PRO_FILES, "src/index.ts": "" },
            repository: "figentra/stackra-pro",
            claims: PRO_CLAIMS,
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await registry.publish(PRO, {
            files: { ...PRO_FILES, "dist/index.mjs.map": "{}" },
            repository: "figentra/stackra-pro",
            claims: PRO_CLAIMS,
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await registry.publish(PRO, {
            files: PRO_FILES,
            repository: "figentra/stackra-pro",
            claims: PRO_CLAIMS,
          })
        ).status,
      ).toBe(201);
    });

    it("refuses a bundle signed by another workflow", async () => {
      const token = await registry.publishToken("@stackra/core");
      const response = await registry.request("/@stackra%2fcore", {
        method: "PUT",
        token,
        body: await publishBody(CORE, { repository: "someone/else" }),
      });
      expect(response.status).toBe(400);
      expect((await body(response)).error).toContain("provenance was not signed by");
    });
  });

  describe("packuments and versions", () => {
    beforeEach(async () => {
      await registry.publish(CORE);
    });

    it("serves the abbreviated form for the install media type", async () => {
      const response = await registry.request("/@stackra/core", {
        accept: "application/vnd.npm.install-v1+json",
      });
      expect(response.headers.get("content-type")).toBe("application/vnd.npm.install-v1+json");
      expect(response.headers.get("cache-control")).toBe("public, max-age=60");
      const packument = await body(response);
      expect(Object.keys(packument).sort()).toEqual(["dist-tags", "modified", "name", "versions"]);
      expect(packument.versions["0.1.0"].description).toBeUndefined();
    });

    it("keeps the rendered packument in KV and drops it on change", async () => {
      await registry.request("/@stackra/core");
      expect(registry.cache.values.has("packument:full:@stackra/core")).toBe(true);
      await registry.publish({ ...CORE, version: "0.2.0" });
      expect(registry.cache.values.has("packument:full:@stackra/core")).toBe(false);
      const packument = await body(await registry.request("/@stackra/core"));
      expect(Object.keys(packument.versions)).toEqual(["0.1.0", "0.2.0"]);
    });

    it("serves one version by number or tag", async () => {
      expect((await body(await registry.request("/@stackra/core/0.1.0"))).version).toBe("0.1.0");
      expect((await body(await registry.request("/@stackra/core/latest"))).version).toBe("0.1.0");
      expect((await registry.request("/@stackra/core/9.9.9")).status).toBe(404);
    });

    it("refuses unpublish", async () => {
      expect((await registry.request("/@stackra%2fcore", { method: "DELETE" })).status).toBe(405);
      expect(
        (await registry.request("/@stackra%2fcore/-rev/1-abc", { method: "DELETE" })).status,
      ).toBe(405);
    });

    it("serves the provenance bundle", async () => {
      const { attestations } = await body(
        await registry.request("/-/npm/v1/attestations/@stackra%2fcore@0.1.0"),
      );
      expect(attestations).toEqual([
        expect.objectContaining({ predicateType: "https://slsa.dev/provenance/v1" }),
      ]);
    });

    it("moves dist-tags with a publish token and audits them", async () => {
      await registry.publish(
        { ...CORE, version: "0.2.0-canary.1" },
        { tags: { canary: "0.2.0-canary.1" } },
      );
      expect(await body(await registry.request("/-/package/@stackra%2fcore/dist-tags"))).toEqual({
        canary: "0.2.0-canary.1",
        latest: "0.1.0",
      });
      const token = await registry.publishToken("@stackra/core");
      const path = "/-/package/@stackra%2fcore/dist-tags/beta";
      expect((await registry.request(path, { method: "PUT", body: "0.1.0" })).status).toBe(401);
      expect((await registry.request(path, { method: "PUT", token, body: "0.1.0" })).status).toBe(
        201,
      );
      expect((await registry.request(path, { method: "PUT", token, body: "7.0.0" })).status).toBe(
        404,
      );
      expect((await registry.request(path, { method: "DELETE", token })).status).toBe(201);
      expect(
        (
          await registry.request("/-/package/@stackra%2fcore/dist-tags/latest", {
            method: "DELETE",
            token,
          })
        ).status,
      ).toBe(400);
      const actions = registry.sqlite
        .prepare("SELECT action FROM audit_events WHERE action LIKE 'dist-tag.%'")
        .all()
        .map((row) => row.action);
      expect(actions).toEqual(["dist-tag.set", "dist-tag.delete"]);
    });

    it("deprecates without re-publishing", async () => {
      const token = await registry.publishToken("@stackra/core");
      const response = await registry.request("/@stackra%2fcore", {
        method: "PUT",
        token,
        body: { name: "@stackra/core", versions: { "0.1.0": { ...CORE, deprecated: "use 0.2" } } },
      });
      expect(response.status).toBe(200);
      expect((await body(await registry.request("/@stackra/core/0.1.0"))).deprecated).toBe(
        "use 0.2",
      );
    });

    it("answers whoami for a publish token", async () => {
      const token = await registry.publishToken("@stackra/core");
      expect(await body(await registry.request("/-/whoami", { token }))).toEqual({
        username: "ci:figentra/stackra",
      });
      expect((await registry.request("/-/whoami")).status).toBe(401);
    });
  });

  describe("licensed scope", () => {
    beforeEach(async () => {
      await registry.publish(PRO, {
        files: PRO_FILES,
        repository: "figentra/stackra-pro",
        claims: PRO_CLAIMS,
      });
    });

    it("needs a licence token: none is 401, unknown is 401, no grant is 403", async () => {
      expect((await registry.request("/@stackra-pro/sync")).status).toBe(401);
      expect((await registry.request("/@stackra-pro/sync", { token: "stkl_unknown" })).status).toBe(
        401,
      );
      registry.licences.licences.set(
        "stkl_other",
        activeLicence({ grants: [{ scope: "@stackra-pro", names: ["@stackra-pro/ui"] }] }),
      );
      expect((await registry.request("/@stackra-pro/sync", { token: "stkl_other" })).status).toBe(
        403,
      );
    });

    it("serves a licensed holder privately and counts the download per licence", async () => {
      registry.licences.licences.set("stkl_good", activeLicence());
      const packument = await registry.request("/@stackra-pro/sync", { token: "stkl_good" });
      expect(packument.status).toBe(200);
      expect(packument.headers.get("cache-control")).toBe("private, no-store");
      const tarball = await registry.request("/@stackra-pro/sync/-/sync-0.1.0.tgz", {
        token: "stkl_good",
      });
      expect(tarball.headers.get("cache-control")).toBe("private, no-store");
      await Promise.all(registry.deferred);
      expect(registry.sqlite.prepare("SELECT licence_id FROM downloads_daily").all()).toEqual([
        { licence_id: "lic_1" },
      ]);
      expect(await body(await registry.request("/-/whoami", { token: "stkl_good" }))).toEqual({
        username: "os:account:acme",
      });
    });

    it("refuses a suspended licence and one past its grace days", async () => {
      registry.licences.licences.set("stkl_s", activeLicence({ status: "suspended" }));
      registry.licences.licences.set(
        "stkl_e",
        activeLicence({ expiresAt: "2026-10-01T00:00:00.000Z" }),
      );
      registry.licences.licences.set(
        "stkl_g",
        activeLicence({ expiresAt: "2026-10-20T00:00:00.000Z" }),
      );
      expect((await registry.request("/@stackra-pro/sync", { token: "stkl_s" })).status).toBe(403);
      expect((await registry.request("/@stackra-pro/sync", { token: "stkl_e" })).status).toBe(403);
      expect((await registry.request("/@stackra-pro/sync", { token: "stkl_g" })).status).toBe(200);
    });

    it("ignores a token on the open scope", async () => {
      await registry.publish(CORE);
      expect((await registry.request("/@stackra/core", { token: "stkl_revoked" })).status).toBe(
        200,
      );
      expect(registry.licences.calls).toEqual([]);
    });

    it("answers entitlements for a licence token", async () => {
      registry.licences.licences.set("stkl_good", activeLicence());
      expect(
        await body(await registry.request("/-/stackra/v1/entitlements", { token: "stkl_good" })),
      ).toEqual({
        holder: "os:account:acme",
        grants: [{ scope: "@stackra-pro", names: "*" }],
        expiresAt: null,
        status: "active",
      });
      expect((await registry.request("/-/stackra/v1/entitlements")).status).toBe(401);
    });
  });

  describe("catalogue", () => {
    beforeEach(async () => {
      await registry.publish(CORE);
      await registry.publish({
        name: "@stackra/skill-archify",
        version: "1.0.0",
        license: "MIT",
        description: "Architecture skill",
        keywords: ["skill"],
        stackra: { kind: "skill" },
      });
      await registry.publish(PRO, {
        files: PRO_FILES,
        repository: "figentra/stackra-pro",
        claims: PRO_CLAIMS,
      });
    });

    it("lists every open and licensed item to anyone, newest first", async () => {
      const page = await body(await registry.request("/-/stackra/v1/catalogue"));
      // Same publish time (fixed clock), so the name breaks the tie, descending.
      expect(page.items.map((item: { name: string }) => item.name)).toEqual([
        "@stackra/skill-archify",
        "@stackra/core",
        "@stackra-pro/sync",
      ]);
      expect(page.next).toBeNull();
      const pro = page.items.find((item: { name: string }) => item.name === "@stackra-pro/sync");
      expect(pro).toEqual(
        expect.objectContaining({ access: "licensed", kind: "package", latest: "0.1.0" }),
      );
    });

    it("filters by kind, scope and text, and pages with a cursor", async () => {
      const skills = await body(await registry.request("/-/stackra/v1/catalogue?kind=skill"));
      expect(skills.items).toEqual([
        expect.objectContaining({
          name: "@stackra/skill-archify",
          kind: "skill",
          keywords: ["skill"],
          stackra: { kind: "skill" },
        }),
      ]);
      const pro = await body(await registry.request("/-/stackra/v1/catalogue?scope=@stackra-pro"));
      expect(pro.items).toHaveLength(1);
      const text = await body(await registry.request("/-/stackra/v1/catalogue?q=architecture"));
      expect(text.items).toHaveLength(1);

      const first = await body(await registry.request("/-/stackra/v1/catalogue?limit=2"));
      expect(first.items).toHaveLength(2);
      const second = await body(
        await registry.request(`/-/stackra/v1/catalogue?limit=2&cursor=${first.next}`),
      );
      expect(second.items).toHaveLength(1);
      expect(second.next).toBeNull();
    });

    it("refuses an unknown kind, a bad limit and a bad cursor", async () => {
      for (const query of ["kind=theme", "limit=0", "limit=101", "cursor=%%%"])
        expect((await registry.request(`/-/stackra/v1/catalogue?${query}`)).status).toBe(400);
    });

    it("answers one item with its versions", async () => {
      const item = await body(await registry.request("/-/stackra/v1/catalogue/@stackra/core"));
      expect(item).toEqual(
        expect.objectContaining({
          name: "@stackra/core",
          access: "open",
          licence: "MIT",
          versions: [
            { version: "0.1.0", publishedAt: "2026-10-27T12:00:00.000Z", deprecated: null },
          ],
        }),
      );
      expect((await registry.request("/-/stackra/v1/catalogue/@stackra/none")).status).toBe(404);
    });
  });
});
