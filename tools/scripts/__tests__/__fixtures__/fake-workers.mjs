/**
 * Stackra file contract:
 * Purpose: fakes of the four Workers the box deploy smoke-tests (registry, turbo-cache, static, edge), built at
 *          runtime with no network: a registry with real ECDSA P-256 signatures and gzip tarballs, a turbo cache that
 *          stores what is put, a static site and an edge that refuses an unsigned JWT. Each takes `breaks` to model
 *          one failure, and records every request (with its version override) for the tests to read.
 * Boundary: test fixture; answers `fetch(url, init)` calls with WHATWG Response objects.
 * Runtime: node
 * Governing contract: ADR 0022; ADR 0536; workers/registry/src (routes and answers), workers/turbo-cache/src,
 *                     workers/edge/src.
 */
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { gzipSync } from "node:zlib";

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

/** The header a request carried, whatever its case. */
const headerOf = (init, name) => {
  const headers = init?.headers ?? {};
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key === undefined ? undefined : headers[key];
};

/**
 * A registry host serving `packages` (`{ name: version }`). `breaks` may hold: `integrity` (the tarball differs from
 * the packument), `signature` (signed by another key), `publish` (a PUT without a token is accepted), `notFound` (an
 * unknown package is 200), `abbreviated` (the abbreviated packument names another latest), `keys` (a keyid that is
 * not the key's digest), `missing` (a sampled package answers 404). `keyPair` keeps one signing key across
 * instances (one fake per version answers with the same registry key, as the real Worker does).
 */
function fakeRegistry({
  host = "npm.stackra.figentra.com",
  packages,
  breaks = new Set(),
  keyPair = generateKeyPairSync("ec", { namedCurve: "P-256" }),
}) {
  const { privateKey, publicKey } = keyPair;
  const other = generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey;
  const spki = publicKey.export({ format: "der", type: "spki" });
  const keyid = `SHA256:${createHash("sha256").update(spki).digest("base64").replace(/=+$/, "")}`;
  const docs = {};
  const tarballs = {};
  for (const [name, version] of Object.entries(packages)) {
    const bytes = gzipSync(Buffer.from(`package ${name}@${version}`));
    const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
    const bare = name.split("/")[1];
    const url = `https://${host}/${name}/-/${bare}-${version}.tgz`;
    tarballs[url] = breaks.has("integrity") ? gzipSync(Buffer.from("other bytes")) : bytes;
    const sig = sign("sha256", Buffer.from(`${name}@${version}:${integrity}`), {
      key: breaks.has("signature") ? other : privateKey,
      dsaEncoding: "der",
    }).toString("base64");
    docs[name] = {
      name,
      "dist-tags": { latest: version },
      versions: {
        [version]: {
          name,
          version,
          dist: {
            integrity,
            shasum: createHash("sha1").update(bytes).digest("hex"),
            tarball: url,
            signatures: [{ keyid, sig }],
          },
        },
      },
    };
  }
  const requests = [];
  const fetch = async (url, init = {}) => {
    const method = init.method ?? "GET";
    requests.push({
      url,
      method,
      override: headerOf(init, "cloudflare-workers-version-overrides"),
    });
    const { pathname } = new URL(url);
    if (tarballs[url]) return new Response(tarballs[url], { status: 200 });
    if (pathname === "/-/ping") return json(200, {});
    if (pathname === "/-/npm/v1/keys")
      return json(200, {
        keys: [
          {
            keyid: breaks.has("keys") ? "SHA256:not-the-digest" : keyid,
            keytype: "ecdsa-sha2-nistp256",
            scheme: "ecdsa-sha2-nistp256",
            key: spki.toString("base64"),
          },
        ],
      });
    if (pathname === "/-/whoami")
      return json(
        401,
        { error: "no valid token" },
        { "www-authenticate": `Bearer realm="${host}"` },
      );
    if (method === "PUT")
      return breaks.has("publish")
        ? json(200, { ok: true })
        : json(
            401,
            { error: "a publish token from the OIDC exchange is required" },
            { "www-authenticate": `Bearer realm="${host}"` },
          );
    if (method === "DELETE")
      return json(405, { error: "unpublish is not supported" }, { allow: "GET, PUT" });
    const name = decodeURIComponent(pathname.slice(1));
    const doc = docs[name];
    if (!doc || (breaks.has("missing") && name !== "@stackra/cli"))
      return breaks.has("notFound") ? json(200, {}) : json(404, { error: "not_found" });
    if ((headerOf(init, "accept") ?? "").includes("application/vnd.npm.install-v1+json")) {
      const latest = breaks.has("abbreviated") ? "0.0.0" : doc["dist-tags"].latest;
      return json(
        200,
        { name, "dist-tags": { latest }, versions: doc.versions },
        { "content-type": "application/vnd.npm.install-v1+json" },
      );
    }
    return json(200, doc);
  };
  return { fetch, requests, docs };
}

/** A turbo cache host; `breaks`: `open` (no auth needed), `lose` (GET answers other bytes), `status`. */
function fakeTurboCache({ token, breaks = new Set() }) {
  const store = new Map();
  const requests = [];
  const fetch = async (url, init = {}) => {
    const method = init.method ?? "GET";
    requests.push({
      url,
      method,
      override: headerOf(init, "cloudflare-workers-version-overrides"),
    });
    const authorized = breaks.has("open") || headerOf(init, "authorization") === `Bearer ${token}`;
    if (!authorized)
      return json(401, {
        error: { code: "unauthorized", message: "A valid bearer token is required" },
      });
    const { pathname, searchParams } = new URL(url);
    if (pathname === "/v8/artifacts/status")
      return breaks.has("status") ? json(503, {}) : json(200, { status: "enabled" });
    const key = `${searchParams.get("slug")}/${pathname.split("/").at(-1)}`;
    if (method === "PUT") {
      store.set(key, { bytes: Buffer.from(init.body), tag: headerOf(init, "x-artifact-tag") });
      return json(202, { urls: [key] });
    }
    const held = store.get(key);
    if (!held) return json(404, { error: { code: "not_found" } });
    const bytes = breaks.has("lose") ? Buffer.from("lost") : held.bytes;
    return new Response(method === "HEAD" ? null : bytes, {
      status: 200,
      headers: { "x-artifact-tag": held.tag ?? "" },
    });
  };
  return { fetch, requests, store };
}

/** A static host; `breaks`: `index` (the schema index is missing). */
function fakeStatic({ breaks = new Set() } = {}) {
  const requests = [];
  const fetch = async (url, init = {}) => {
    requests.push({
      url,
      method: init.method ?? "GET",
      override: headerOf(init, "cloudflare-workers-version-overrides"),
    });
    const { pathname } = new URL(url);
    if (pathname === "/") return new Response("<!doctype html>", { status: 200 });
    if (pathname === "/schemas/index.json")
      return breaks.has("index")
        ? new Response("missing", { status: 404 })
        : json(200, { schemas: [] });
    return new Response("not found", { status: 404 });
  };
  return { fetch, requests };
}

/** An edge host; `breaks`: `forward` (an unsigned JWT is forwarded to the origin). */
function fakeEdge({ breaks = new Set() } = {}) {
  const requests = [];
  const fetch = async (url, init = {}) => {
    requests.push({
      url,
      method: init.method ?? "GET",
      override: headerOf(init, "cloudflare-workers-version-overrides"),
    });
    if (
      !breaks.has("forward") &&
      /^Bearer [\w-]+\.[\w-]+\.[\w-]*$/.test(headerOf(init, "authorization") ?? "")
    )
      return new Response("", {
        status: 401,
        headers: {
          "www-authenticate": 'Bearer error="invalid_token"',
          "x-content-type-options": "nosniff",
        },
      });
    return new Response("from the origin", { status: 200 });
  };
  return { fetch, requests };
}

/** One `fetch` over several hosts: `{ host: fake }`; any other host is a test failure. */
const routedFetch = (hosts) => async (url, init) => {
  const fake = hosts[new URL(url).host];
  if (!fake) throw new Error(`no fake for ${url}`);
  return fake.fetch(url, init);
};

/** The fakes, by Worker: `registry`, `turboCache`, `static`, `edge`, and `routed` to serve several hosts. */
export const fakeWorkers = Object.freeze({
  registry: fakeRegistry,
  turboCache: fakeTurboCache,
  static: fakeStatic,
  edge: fakeEdge,
  routed: routedFetch,
});
