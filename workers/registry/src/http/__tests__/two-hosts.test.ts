/**
 * Stackra file contract:
 * Purpose: end-to-end tests of the registry on its two hosts (STA-2892): `npm.figentra.com` is the main host and
 *          `npm.stackra.figentra.com` stays a second Custom Domain. Metadata read on either host names tarballs and
 *          attestations on that host, so an existing `.npmrc` or lockfile on the old host keeps installing; each host
 *          keeps its own cached packument and a publish drops both (and the host-less key of the version before); a
 *          host the Worker does not list never reaches a URL; an OIDC exchange works for either host's audience.
 * Boundary: test only; D1 is node:sqlite with the real migrations, everything else in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453; ADR 0025 (npm.figentra.com).
 */
import {
  ALIAS_HOST,
  createTestRegistry,
  HOST,
  STACKRA_CLAIMS,
} from "#src/__tests__/fixtures/registry.fixture";

const CORE = { name: "@stackra/core", version: "0.1.0", license: "MIT", description: "Core" };
const ABBREVIATED = "application/vnd.npm.install-v1+json";

type Registry = Awaited<ReturnType<typeof createTestRegistry>>;

// oxlint-disable-next-line typescript/no-explicit-any -- the tests read deep npm JSON shapes by path
type Json = any;

const body = async (response: Response): Promise<Json> => (await response.json()) as Json;

/** The `dist` of @stackra/core 0.1.0 as the packument read on `host` (abbreviated or full) names it. */
const distOn = async (registry: Registry, host: string, accept?: string): Promise<Json> =>
  (await body(await registry.request("/@stackra%2fcore", { host, ...(accept ? { accept } : {}) })))
    .versions["0.1.0"].dist;

describe("the registry on two hosts (STA-2892)", () => {
  let registry: Registry;

  beforeEach(async () => {
    registry = await createTestRegistry();
    expect((await registry.publish(CORE)).status).toBe(201);
  });

  it.each([HOST, ALIAS_HOST])(
    "names tarballs and attestations on %s when read there",
    async (host) => {
      for (const accept of [undefined, ABBREVIATED]) {
        const dist = await distOn(registry, host, accept);
        expect(dist.tarball).toBe(`https://${host}/@stackra/core/-/core-0.1.0.tgz`);
      }
      const full = await distOn(registry, host);
      expect(full.attestations.url).toBe(
        `https://${host}/-/npm/v1/attestations/@stackra/core@0.1.0`,
      );
      const manifest = await body(await registry.request("/@stackra/core/0.1.0", { host }));
      expect(manifest.dist.tarball).toBe(`https://${host}/@stackra/core/-/core-0.1.0.tgz`);
    },
  );

  it("serves the same signed tarball on both hosts", async () => {
    const main = await registry.request("/@stackra/core/-/core-0.1.0.tgz", { host: HOST });
    const alias = await registry.request("/@stackra/core/-/core-0.1.0.tgz", { host: ALIAS_HOST });
    expect(main.status).toBe(200);
    expect(alias.status).toBe(200);
    expect(Buffer.from(await alias.arrayBuffer())).toEqual(Buffer.from(await main.arrayBuffer()));
    // The signature covers name, version and integrity only, so it verifies whichever host served it.
    const [onMain, onAlias] = [await distOn(registry, HOST), await distOn(registry, ALIAS_HOST)];
    expect(onAlias.integrity).toBe(onMain.integrity);
    expect(onAlias.signatures).toEqual(onMain.signatures);
  });

  it("keeps one cached packument per host, so a read on one host never answers the other", async () => {
    // The alias first: a host-less cache would hand its body, with alias URLs, to the main host.
    expect((await distOn(registry, ALIAS_HOST)).tarball).toContain(`https://${ALIAS_HOST}/`);
    expect((await distOn(registry, HOST)).tarball).toContain(`https://${HOST}/`);
    expect((await distOn(registry, ALIAS_HOST)).tarball).toContain(`https://${ALIAS_HOST}/`);
    expect([...registry.cache.values.keys()].filter((key) => key.startsWith("packument:"))).toEqual(
      [`packument:full:${ALIAS_HOST}:@stackra/core`, `packument:full:${HOST}:@stackra/core`],
    );
  });

  it("drops every host's packument and the key of the version before on a publish", async () => {
    for (const host of [HOST, ALIAS_HOST])
      for (const accept of [undefined, ABBREVIATED]) await distOn(registry, host, accept);
    // A packument cached by the version before this one, under its host-less key.
    await registry.cache.put("packument:full:@stackra/core", "{}");
    await registry.cache.put("packument:abbreviated:@stackra/core", "{}");
    expect((await registry.publish({ ...CORE, version: "0.2.0" })).status).toBe(201);
    expect([...registry.cache.values.keys()].filter((key) => key.startsWith("packument:"))).toEqual(
      [],
    );
    for (const host of [HOST, ALIAS_HOST]) {
      const packument = await body(await registry.request("/@stackra/core", { host }));
      expect(packument.versions["0.2.0"].dist.tarball).toBe(
        `https://${host}/@stackra/core/-/core-0.2.0.tgz`,
      );
    }
  });

  it("names the main host when the request came in on a host it does not list", async () => {
    const dist = await distOn(registry, "evil.example");
    expect(dist.tarball).toBe(`https://${HOST}/@stackra/core/-/core-0.1.0.tgz`);
    expect(registry.cache.values.has("packument:full:evil.example:@stackra/core")).toBe(false);
  });

  it("names the host the request came in on in the auth realm", async () => {
    for (const host of [HOST, ALIAS_HOST]) {
      const response = await registry.request("/-/whoami", { host });
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toBe(`Bearer realm="${host}"`);
    }
  });

  it("accepts a publish whose GitHub ID token names either host's audience", async () => {
    for (const host of [HOST, ALIAS_HOST]) {
      const response = await registry.request(
        "/-/npm/v1/oidc/token/exchange/package/@stackra%2fcore",
        {
          method: "POST",
          token: await registry.idToken({ ...STACKRA_CLAIMS, aud: `npm:${host}` }),
          host,
        },
      );
      expect(response.status).toBe(201);
    }
  });
});
