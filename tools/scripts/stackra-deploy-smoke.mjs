/**
 * Stackra file contract:
 * Purpose: the smoke suites of the box Worker deploy path (STA-2783, ADR 0536 gate 2), run against one Worker version
 *   at every promotion step: at 0% (the version is in the deployment with no traffic and reached through
 *   `Cloudflare-Workers-Version-Overrides`) and at each step after. Every Worker gets runway.yaml's uptime checks for
 *   its hosts and its member `smoke` URLs, then its own suite:
 *   - registry (the strongest: no approval stands behind it): `/-/ping`; `/-/npm/v1/keys` (each keyid is the SHA-256
 *     of its key); for each sampled @stackra package (one per release group under packages/, plus @stackra/cli) the
 *     full and the abbreviated packument (shape, `dist-tags.latest` among the versions, the tarball URL on the
 *     registry host), the latest version's tarball (gzip, sha512 equal to `dist.integrity`, sha1 equal to
 *     `dist.shasum`, the same integrity as production served before the deploy), and its registry signature
 *     (ECDSA P-256 over `<name>@<version>:<integrity>` under a key of `/-/npm/v1/keys`); then the refusals that
 *     change nothing: a publish `PUT` without a token (401 with `WWW-Authenticate: Bearer`, the auth runs before the
 *     body is read, and `{}` carries no version), an unpublish `DELETE` (405, versions are immutable), `/-/whoami`
 *     without a token (401), and a package that does not exist (404 `not_found`). While `REGISTRY_READ_ONLY` is
 *     `true`, the two writes answer 503 `registry_read_only` instead.
 *   - turbo-cache: `/v8/artifacts/status` without a token and with a wrong one (401), with the token (200 enabled),
 *     then a round trip in its own `stackra-deploy-smoke` team: PUT (202), HEAD (200), GET (200, same bytes and tag).
 *   - static: the root and `/schemas/index.json` (JSON).
 *   - edge: each smoke URL with a JWT-shaped bearer token signed by nobody (`alg: none`) answers 401
 *     `Bearer error="invalid_token"` with `X-Content-Type-Options: nosniff`, the edge's own answer before any origin.
 * Boundary: HTTP GET/HEAD and the two refused writes through the given `fetch` only; no secret is printed: the
 *   turbo token is a header value and never part of a result. A result names the URL path and what was wrong.
 * Runtime: node
 * Governing contract: ADR 0536; ADR 0453 (the registry routes and signatures); ADR 0026 (the cache API); ADR 0437
 *   (the edge Worker); ADR 0185 (uptime checks).
 */
import { createHash, createPublicKey, randomBytes, verify as verifySignature } from "node:crypto";

/** The header that routes a request to one version of a Worker in the current deployment. */
export const VERSION_OVERRIDE_HEADER = "cloudflare-workers-version-overrides";

/** npm's media type for the abbreviated packument. */
export const ABBREVIATED = "application/vnd.npm.install-v1+json";

/** The team the turbo-cache round trip writes in; never a real team. */
export const SMOKE_TEAM = "stackra-deploy-smoke";

/** A JWT-shaped token signed by nobody: `{"alg":"none"}`.`{}`.`` — the edge must refuse it. */
export const UNSIGNED_JWT = "eyJhbGciOiJub25lIn0.e30.";

/** The `Cloudflare-Workers-Version-Overrides` value for `worker` at `version`. */
export const overrideFor = (worker, version) => `${worker}="${version}"`;

/** One check's result. */
const pass = (name) => ({ name, ok: true });
const fail = (name, detail) => ({ name, ok: false, detail });

/** `fetch` with the override header (when given), no redirects followed, a time limit. */
async function request(io, url, { method = "GET", headers = {}, body, override } = {}) {
  const all = { ...headers };
  if (override) all[VERSION_OVERRIDE_HEADER] = override;
  return io.fetch(url, {
    method,
    headers: all,
    ...(body === undefined ? {} : { body }),
    redirect: "manual",
    signal: AbortSignal.timeout(io.timeoutMs ?? 30_000),
  });
}

/** The path of a URL, for a result line (never its query, which could carry a value). */
const pathOf = (url) => {
  try {
    return new URL(url).pathname;
  } catch {
    return "(bad url)";
  }
};

/** Reads a JSON body, or undefined. */
async function jsonOf(response) {
  try {
    return JSON.parse(await response.text());
  } catch {
    return undefined;
  }
}

/** Whether `status` is one runway's uptime check expects (2xx unless `expected` lists codes). */
const statusMatches = (status, expected) =>
  Array.isArray(expected) && expected.length > 0
    ? expected.includes(status)
    : status >= 200 && status < 300;

/**
 * The generic checks of a Worker from runway.yaml: its uptime entries (matched by host) and its member smoke URLs
 * (2xx, with the bearer named by `bearer` when the member declares one).
 */
export function runwayChecks(root, memberKey) {
  const member = root?.targets?.["cloudflare-workers"]?.members?.[memberKey] ?? {};
  const hosts = new Set(member.customDomains ?? []);
  const uptime = (root?.observability?.uptime ?? [])
    .filter((entry) => {
      try {
        return hosts.has(new URL(entry.url).host);
      } catch {
        return false;
      }
    })
    .map((entry) => ({
      name: `uptime ${entry.name}`,
      url: entry.url,
      expected: entry.expectedStatusCodes,
    }));
  const smoke = (member.smoke ?? []).map((entry) => ({
    name: `smoke ${pathOf(entry.url)}`,
    url: entry.url,
    bearer: entry.bearer,
  }));
  return [...uptime, ...smoke];
}

/** Runs the runway checks; `bearers` maps a bearer name (TURBO_TOKEN) to its value. */
async function runRunwayChecks(io, checks, { override, bearers = {} }) {
  const results = [];
  for (const check of checks) {
    const headers = {};
    if (check.bearer) {
      const value = bearers[check.bearer];
      if (!value) {
        results.push(fail(check.name, `no value for the bearer ${check.bearer}`));
        continue;
      }
      headers.authorization = `Bearer ${value}`;
    }
    try {
      const response = await request(io, check.url, { headers, override });
      results.push(
        statusMatches(response.status, check.expected)
          ? pass(check.name)
          : fail(check.name, `${pathOf(check.url)} answered ${response.status}`),
      );
    } catch (error) {
      results.push(fail(check.name, `${pathOf(check.url)} failed: ${error.name}`));
    }
  }
  return results;
}

// ---- registry ---------------------------------------------------------------------------------------------------

/** The keyid npm and the registry give an SPKI DER key: `SHA256:` and its unpadded base64 digest. */
export const keyIdOf = (der) =>
  `SHA256:${createHash("sha256").update(der).digest("base64").replace(/=+$/, "")}`;

/** Whether `sig` (base64 DER ECDSA) signs `<name>@<version>:<integrity>` under the base64 SPKI `key`. */
export function signatureValid({ name, version, integrity, key, sig }) {
  try {
    const publicKey = createPublicKey({
      key: Buffer.from(key, "base64"),
      format: "der",
      type: "spki",
    });
    return verifySignature(
      "sha256",
      Buffer.from(`${name}@${version}:${integrity}`),
      publicKey,
      Buffer.from(sig, "base64"),
    );
  } catch {
    return false;
  }
}

/**
 * The registry sample: per release group (the first folder under packages/), the first published
 * (non-private) package of the `@stackra` scope by name, plus `@stackra/cli`. `packages` is `[{ name, dir, private }]` from the deployed tree.
 */
export function registrySample(packages) {
  const groups = new Map();
  for (const pkg of packages) {
    if (pkg.private || typeof pkg.name !== "string" || !pkg.name.startsWith("@stackra/")) continue;
    const [top, group] = pkg.dir.split("/");
    if (top !== "packages" || !group) continue;
    const held = groups.get(group);
    if (!held || pkg.name < held) groups.set(group, pkg.name);
  }
  const names = new Set(groups.values());
  names.add("@stackra/cli");
  return [...names].toSorted();
}

/** The registry's tarball URL of `name@version` on `host` (workers/registry/src/npm/dist-of.ts). */
export const tarballUrlOf = (host, name, version) =>
  `https://${host}/${name}/-/${name.split("/")[1]}-${version}.tgz`;

/** What the registry's packument of `name` must hold for its latest version; an empty list when it does. */
export function packumentProblems(doc, { name, host }) {
  const problems = [];
  if (!doc || typeof doc !== "object") return ["the body is not JSON"];
  if (doc.name !== name) problems.push(`name is ${JSON.stringify(doc.name)}`);
  const latest = doc["dist-tags"]?.latest;
  if (typeof latest !== "string") return [...problems, "no dist-tags.latest"];
  const version = doc.versions?.[latest];
  if (!version) return [...problems, `dist-tags.latest ${latest} is not among the versions`];
  const dist = version.dist ?? {};
  if (!/^sha512-[A-Za-z0-9+/]{86}==$/.test(dist.integrity ?? ""))
    problems.push("dist.integrity is not a sha512 integrity");
  if (dist.tarball !== tarballUrlOf(host, name, latest))
    problems.push("dist.tarball is not the registry's own URL");
  return problems;
}

/**
 * The registry Worker's suite. `sample` lists the package names; `baseline` maps `name` to the `{ version,
 * integrity }` production served before the deploy (versions are immutable, so a version's integrity never changes);
 * `readOnly` is the deployed `REGISTRY_READ_ONLY`.
 */
export async function registrySuite(
  io,
  { base, override, sample, baseline = {}, readOnly = false },
) {
  const host = new URL(base).host;
  const results = [];
  const get = (path, headers = {}) => request(io, `${base}${path}`, { headers, override });

  const ping = await get("/-/ping");
  const pingBody = ping.status === 200 ? await jsonOf(ping) : undefined;
  results.push(
    ping.status === 200 && pingBody && typeof pingBody === "object"
      ? pass("registry ping")
      : fail("registry ping", `/-/ping answered ${ping.status}`),
  );

  const keysAnswer = await get("/-/npm/v1/keys");
  const keys = keysAnswer.status === 200 ? ((await jsonOf(keysAnswer))?.keys ?? []) : [];
  const keyById = new Map();
  for (const key of Array.isArray(keys) ? keys : []) {
    if (typeof key?.key !== "string" || typeof key?.keyid !== "string") continue;
    if (keyIdOf(Buffer.from(key.key, "base64")) === key.keyid) keyById.set(key.keyid, key.key);
  }
  results.push(
    keyById.size > 0 && keyById.size === keys.length
      ? pass("registry signing keys")
      : fail(
          "registry signing keys",
          keysAnswer.status === 200
            ? "a key's keyid is not the SHA-256 of its key, or no key is listed"
            : `/-/npm/v1/keys answered ${keysAnswer.status}`,
        ),
  );

  if (sample.length === 0) results.push(fail("registry sample", "the package sample is empty"));
  for (const name of sample) {
    const label = `registry ${name}`;
    const full = await get(`/${name}`, { accept: "application/json" });
    if (full.status !== 200) {
      results.push(fail(`${label} packument`, `answered ${full.status}`));
      continue;
    }
    const doc = await jsonOf(full);
    const problems = packumentProblems(doc, { name, host });
    if (problems.length > 0) {
      results.push(fail(`${label} packument`, problems.join("; ")));
      continue;
    }
    results.push(pass(`${label} packument`));
    const latest = doc["dist-tags"].latest;
    const dist = doc.versions[latest].dist;

    const short = await get(`/${name}`, { accept: ABBREVIATED });
    const shortDoc = short.status === 200 ? await jsonOf(short) : undefined;
    const shortType = short.headers.get("content-type") ?? "";
    results.push(
      short.status === 200 &&
        shortType.startsWith(ABBREVIATED) &&
        shortDoc?.["dist-tags"]?.latest === latest &&
        shortDoc?.versions?.[latest]?.dist?.integrity === dist.integrity
        ? pass(`${label} abbreviated packument`)
        : fail(
            `${label} abbreviated packument`,
            short.status === 200
              ? "its type, latest or integrity differs from the full packument"
              : `answered ${short.status}`,
          ),
    );

    const tarball = await request(io, dist.tarball, { override });
    if (tarball.status !== 200) {
      results.push(fail(`${label} tarball`, `${pathOf(dist.tarball)} answered ${tarball.status}`));
    } else {
      const bytes = Buffer.from(await tarball.arrayBuffer());
      const sha512 = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
      const sha1 = createHash("sha1").update(bytes).digest("hex");
      const gzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
      const wrong = [
        ...(gzip ? [] : ["it is not gzip"]),
        ...(sha512 === dist.integrity ? [] : ["its sha512 is not dist.integrity"]),
        ...(dist.shasum === undefined || sha1 === dist.shasum
          ? []
          : ["its sha1 is not dist.shasum"]),
      ];
      results.push(
        wrong.length === 0
          ? pass(`${label} tarball integrity`)
          : fail(`${label} tarball integrity`, wrong.join("; ")),
      );
    }

    const before = baseline[name];
    results.push(
      !before || before.version !== latest || before.integrity === dist.integrity
        ? pass(`${label} matches production`)
        : fail(`${label} matches production`, `${latest} has another integrity than before`),
    );

    const signatures = Array.isArray(dist.signatures) ? dist.signatures : [];
    const signed = signatures.some(
      (s) =>
        keyById.has(s?.keyid) &&
        signatureValid({
          name,
          version: latest,
          integrity: dist.integrity,
          key: keyById.get(s.keyid),
          sig: s.sig,
        }),
    );
    results.push(
      signed
        ? pass(`${label} signature`)
        : fail(`${label} signature`, "no signature verifies under a listed key"),
    );
  }

  const absent = `@stackra/stackra-deploy-smoke-absent-${randomBytes(6).toString("hex")}`;
  const missing = await get(`/${absent}`, { accept: "application/json" });
  const missingBody = await jsonOf(missing);
  results.push(
    missing.status === 404 && missingBody?.error === "not_found"
      ? pass("registry unknown package is 404")
      : fail("registry unknown package is 404", `answered ${missing.status}`),
  );

  const publish = await request(io, `${base}/@stackra%2fcli`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: "{}",
    override,
  });
  const publishBody = await jsonOf(publish);
  const challenge = publish.headers.get("www-authenticate") ?? "";
  results.push(
    readOnly
      ? publish.status === 503 && /registry_read_only/.test(publishBody?.error ?? "")
        ? pass("registry publish without a token is refused")
        : fail("registry publish without a token is refused", `answered ${publish.status}`)
      : publish.status === 401 && challenge.startsWith("Bearer realm=")
        ? pass("registry publish without a token is refused")
        : fail("registry publish without a token is refused", `answered ${publish.status}`),
  );

  const unpublish = await request(io, `${base}/@stackra/cli/-rev/0`, {
    method: "DELETE",
    override,
  });
  results.push(
    unpublish.status === (readOnly ? 503 : 405)
      ? pass("registry unpublish is refused")
      : fail("registry unpublish is refused", `answered ${unpublish.status}`),
  );

  const whoami = await get("/-/whoami");
  results.push(
    whoami.status === 401
      ? pass("registry whoami without a token is 401")
      : fail("registry whoami without a token is 401", `answered ${whoami.status}`),
  );
  return results;
}

// ---- turbo-cache ------------------------------------------------------------------------------------------------

/** The turbo-cache Worker's suite: refusals, the authenticated status and a round trip in its own team. */
export async function turboCacheSuite(io, { base, override, token }) {
  const results = [];
  if (!token) return [fail("turbo-cache token", "no turbo token is configured")];
  const status = `${base}/v8/artifacts/status`;
  const bare = await request(io, status, { override });
  const bareBody = await jsonOf(bare);
  results.push(
    bare.status === 401 && bareBody?.error?.code === "unauthorized"
      ? pass("turbo-cache unauthenticated is 401")
      : fail("turbo-cache unauthenticated is 401", `answered ${bare.status}`),
  );
  const wrong = await request(io, status, {
    override,
    headers: { authorization: `Bearer stackra-deploy-smoke-${randomBytes(8).toString("hex")}` },
  });
  results.push(
    wrong.status === 401
      ? pass("turbo-cache wrong token is 401")
      : fail("turbo-cache wrong token is 401", `answered ${wrong.status}`),
  );
  const auth = { authorization: `Bearer ${token}` };
  const enabled = await request(io, status, { override, headers: auth });
  const enabledBody = await jsonOf(enabled);
  results.push(
    enabled.status === 200 && enabledBody?.status === "enabled"
      ? pass("turbo-cache authenticated status")
      : fail("turbo-cache authenticated status", `answered ${enabled.status}`),
  );
  const hash = `deploysmoke${randomBytes(16).toString("hex")}`;
  const artifact = `${base}/v8/artifacts/${hash}?slug=${SMOKE_TEAM}`;
  const bytes = randomBytes(64);
  const tag = `smoke-${randomBytes(4).toString("hex")}`;
  const put = await request(io, artifact, {
    method: "PUT",
    override,
    headers: {
      ...auth,
      "content-type": "application/octet-stream",
      "content-length": String(bytes.length),
      "x-artifact-tag": tag,
    },
    body: bytes,
  });
  results.push(
    put.status === 202
      ? pass("turbo-cache upload")
      : fail("turbo-cache upload", `answered ${put.status}`),
  );
  const head = await request(io, artifact, { method: "HEAD", override, headers: auth });
  results.push(
    head.status === 200
      ? pass("turbo-cache exists")
      : fail("turbo-cache exists", `answered ${head.status}`),
  );
  const back = await request(io, artifact, { override, headers: auth });
  const same =
    back.status === 200 &&
    Buffer.from(await back.arrayBuffer()).equals(bytes) &&
    back.headers.get("x-artifact-tag") === tag;
  results.push(
    same
      ? pass("turbo-cache download")
      : fail("turbo-cache download", `answered ${back.status}, or other bytes or tag`),
  );
  return results;
}

// ---- static and edge --------------------------------------------------------------------------------------------

/** The static Worker's suite: the root and the schema index. */
export async function staticSuite(io, { base, override }) {
  const root = await request(io, `${base}/`, { override });
  const index = await request(io, `${base}/schemas/index.json`, { override });
  const indexBody = index.status === 200 ? await jsonOf(index) : undefined;
  return [
    root.status === 200 ? pass("static root") : fail("static root", `/ answered ${root.status}`),
    index.status === 200 && indexBody !== undefined
      ? pass("static schema index")
      : fail("static schema index", `/schemas/index.json answered ${index.status} or no JSON`),
  ];
}

/** The edge Worker's suite: an unsigned JWT is refused by the edge itself, with the security headers. */
export async function edgeSuite(io, { urls, override }) {
  if (urls.length === 0) return [fail("edge", "the edge member has no smoke URL to probe")];
  const results = [];
  for (const url of urls) {
    const answer = await request(io, url, {
      override,
      headers: { authorization: `Bearer ${UNSIGNED_JWT}` },
    });
    const ok =
      answer.status === 401 &&
      /invalid_token/.test(answer.headers.get("www-authenticate") ?? "") &&
      answer.headers.get("x-content-type-options") === "nosniff";
    results.push(
      ok
        ? pass(`edge refuses an unsigned token ${pathOf(url)}`)
        : fail(`edge refuses an unsigned token ${pathOf(url)}`, `answered ${answer.status}`),
    );
  }
  return results;
}

/**
 * The whole smoke of one Worker version: runway's checks, then the Worker's suite. `context` carries `root` (the
 * parsed runway.yaml), `member`, `workerName` (the script name the override names), `version` (undefined: no
 * override, production as it serves), `sample`, `baseline`, `readOnly` and `turboToken`.
 */
export async function smokeWorker(io, context) {
  const { root, member: memberKey, workerName, version } = context;
  const member = root?.targets?.["cloudflare-workers"]?.members?.[memberKey];
  if (!member)
    return { ok: false, results: [fail("member", `${memberKey} is not a runway member`)] };
  const domain = member.customDomains?.[0];
  const base = domain ? `https://${domain}` : undefined;
  const override = version ? overrideFor(workerName, version) : undefined;
  const results = await runRunwayChecks(io, runwayChecks(root, memberKey), {
    override,
    bearers: { TURBO_TOKEN: context.turboToken },
  });
  if (memberKey === "registry")
    results.push(
      ...(await registrySuite(io, {
        base,
        override,
        sample: context.sample ?? [],
        baseline: context.baseline,
        readOnly: context.readOnly,
      })),
    );
  else if (memberKey === "turbo-cache")
    results.push(...(await turboCacheSuite(io, { base, override, token: context.turboToken })));
  else if (memberKey === "static") results.push(...(await staticSuite(io, { base, override })));
  else if (memberKey === "edge")
    results.push(
      ...(await edgeSuite(io, { urls: (member.smoke ?? []).map((s) => s.url), override })),
    );
  else results.push(fail("suite", `no smoke suite for ${memberKey}`));
  if (!base && memberKey !== "edge")
    results.push(fail("host", `${memberKey} has no custom domain to probe`));
  return { ok: results.every((r) => r.ok), results };
}

/**
 * What production serves now for each sampled package (no override): `{ name: { version, integrity } }` and the
 * names it does not serve (dropped from the sample: a package never published cannot be checked).
 */
export async function registryBaseline(io, { base, sample }) {
  const baseline = {};
  const absent = [];
  for (const name of sample) {
    const answer = await request(io, `${base}/${name}`, {
      headers: { accept: "application/json" },
    });
    if (answer.status === 404) {
      absent.push(name);
      continue;
    }
    if (answer.status !== 200) throw new Error(`production answered ${answer.status} for ${name}`);
    const doc = await jsonOf(answer);
    const latest = doc?.["dist-tags"]?.latest;
    const integrity = doc?.versions?.[latest]?.dist?.integrity;
    if (typeof latest !== "string" || typeof integrity !== "string")
      throw new Error(`production's packument of ${name} has no latest integrity`);
    baseline[name] = { version: latest, integrity };
  }
  return { baseline, absent };
}
