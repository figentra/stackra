/**
 * Stackra file contract:
 * Purpose: unit tests of `serveRegistry`: a Worker with no signing key, an empty one, an unreadable one or a missing var
 *          answers every route (the health check included) 503 `registry_misconfigured` and logs the cause without the
 *          key, instead of failing with an unhandled error; a configured one serves the registry, serves it again after
 *          a refused request, and imports the signer again when the key changes. Every answer, a 503 included, names
 *          the running version in `x-stackra-version` (the deploy smoke's proof, STA-2786).
 * Boundary: test only; the Worker's bindings are the fakes of `src/__tests__/fixtures`, the signing keys are fresh
 *           ECDSA P-256 keys, no network. The signer is cached per isolate, so the case with the cache still empty runs
 *           first.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 2, 13 and 19); ADR 0173 (secrets).
 */
import { generateKeyPairSync } from "node:crypto";

import type { MockInstance } from "vitest";

import { ENV_VARS, HOST } from "#src/__tests__/fixtures/registry.fixture";
import {
  MemoryEdgeCache,
  MemoryKv,
  MemoryR2,
} from "#src/__tests__/fixtures/memory-bindings.fixture";
import { sqliteD1 } from "#src/__tests__/fixtures/sqlite-d1.fixture";
import { serveRegistry } from "#src/http/serve-registry";
import type { RegistryEnv } from "#src/interfaces/registry-env.interface";

/** A fresh signing key, as the secret holds it: a PKCS#8 PEM. */
const newPem = (): string =>
  generateKeyPairSync("ec", { namedCurve: "P-256" })
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString();

/** The Worker's environment over the fakes: the bindings and the vars, with `overrides` on top (no key unless given). */
function envOf(overrides: Readonly<Record<string, unknown>> = {}): RegistryEnv {
  return {
    DB: sqliteD1().db,
    TARBALLS: new MemoryR2(),
    CACHE: new MemoryKv(),
    ...ENV_VARS,
    ...overrides,
  } as unknown as RegistryEnv;
}

/** One request to the Worker. */
const serve = (env: RegistryEnv, path = "/-/ping"): Promise<Response> =>
  serveRegistry(
    new Request(`https://${HOST}${path}`),
    env,
    { waitUntil: () => {} },
    new MemoryEdgeCache(),
  );

/** The keyid the Worker advertises for its signing key. */
async function advertisedKeyId(env: RegistryEnv): Promise<string> {
  const body = (await (await serve(env, "/-/npm/v1/keys")).json()) as {
    keys: { keyid: string }[];
  };
  expect(body.keys).toHaveLength(1);
  return body.keys[0]?.keyid ?? "";
}

describe("serveRegistry", () => {
  let logged: MockInstance<typeof console.error>;

  beforeEach(() => {
    logged = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logged.mockRestore();
  });

  it("answers 503 on every route when the signing key is not set, and logs which secret", async () => {
    // The first request of the isolate: nothing imported yet, and an unset secret equals the empty cache entry.
    for (const path of ["/-/ping", "/", "/-/npm/v1/keys"]) {
      const response = await serve(envOf(), path);
      expect(response.status).toBe(503);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toEqual({ error: "registry_misconfigured" });
    }
    expect(logged).toHaveBeenCalledWith(
      "stackra-registry",
      "RangeError: REGISTRY_SIGNING_KEY is not set",
    );
  });

  it("treats an empty signing key as not set", async () => {
    const response = await serve(envOf({ REGISTRY_SIGNING_KEY: "" }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "registry_misconfigured" });
    expect(logged).toHaveBeenCalledWith(
      "stackra-registry",
      "RangeError: REGISTRY_SIGNING_KEY is not set",
    );
  });

  it("answers 503 for a signing key that is not a key, without writing the key to the log", async () => {
    const secret = "this-is-not-a-pem-and-must-not-be-logged";
    const response = await serve(envOf({ REGISTRY_SIGNING_KEY: secret }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "registry_misconfigured" });
    expect(logged).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logged.mock.calls)).not.toContain(secret);
  });

  it("answers 503 when a var is missing, and logs which one", async () => {
    const response = await serve(
      envOf({ REGISTRY_SIGNING_KEY: newPem(), REGISTRY_HOST: undefined }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "registry_misconfigured" });
    expect(logged).toHaveBeenCalledWith("stackra-registry", "RangeError: REGISTRY_HOST is not set");
  });

  it("serves the registry once configured, after the requests it refused", async () => {
    const env = envOf({ REGISTRY_SIGNING_KEY: newPem() });
    const response = await serve(env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
    expect(await advertisedKeyId(env)).not.toBe("");
    expect(logged).not.toHaveBeenCalled();
  });

  it("names the running version on every answer, a misconfigured 503 included", async () => {
    const version = "dc8dcd28-271b-4367-9840-6c244f84cb40";
    const env = envOf({ REGISTRY_SIGNING_KEY: newPem(), CF_VERSION_METADATA: { id: version } });
    for (const path of ["/-/ping", "/-/npm/v1/keys", "/@stackra/absent"]) {
      const response = await serve(env, path);
      expect(response.headers.get("x-stackra-version")).toBe(version);
    }
    const broken = await serve(envOf({ CF_VERSION_METADATA: { id: version } }));
    expect(broken.status).toBe(503);
    expect(broken.headers.get("x-stackra-version")).toBe(version);
    // Without the binding (a local run), no header is invented.
    expect(
      (await serve(envOf({ REGISTRY_SIGNING_KEY: newPem() }))).headers.has("x-stackra-version"),
    ).toBe(false);
  });

  it("imports the signer again when the key changes, and keeps it while the key stays", async () => {
    const first = envOf({ REGISTRY_SIGNING_KEY: newPem() });
    const second = envOf({ REGISTRY_SIGNING_KEY: newPem() });
    const firstId = await advertisedKeyId(first);
    expect(await advertisedKeyId(first)).toBe(firstId);
    expect(await advertisedKeyId(second)).not.toBe(firstId);
  });
});
