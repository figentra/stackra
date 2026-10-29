/**
 * Stackra file contract:
 * Purpose: the one HTTP transport the store clients (`store-asc.mjs`, `store-play.mjs`) and the review probe use, with
 *   four modes (ADR 0480):
 *     dry-run   the default: nothing is sent; reads answer from fixtures when there is one, writes are recorded as
 *               planned and answered with a synthetic `dry-run` id
 *     replay    tests: every call must match a recorded fixture, or the call throws
 *     live      sends the request; allowed only inside a GitHub Actions job (the protected environment is the
 *               owner's approval)
 *     record    live, and writes each answer as a fixture with credentials and secret-looking fields scrubbed
 * Boundary: requests and fixtures only. Never logs a header or a request body; the plan lists method and path.
 * Runtime: node
 * Governing contract: ADR 0480 (API-first release); ADR 0257 (nobody reads a value).
 * Secrets: callers put a bearer token in `headers`; this file never prints, records or returns a header.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const MODES = ["dry-run", "replay", "live", "record"];
const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// Field names whose values never reach a fixture.
const SECRET_FIELD = /password|secret|token|private|key$|assertion|authorization/i;

/** `GET /v1/apps?filter[bundleId]=x` → a file-safe fixture name. */
export function fixtureName(method, url) {
  const u = new URL(url);
  const slug = `${u.hostname.split(".")[0]}${u.pathname}${u.search}`
    .replaceAll(/[^A-Za-z0-9.-]+/g, "_")
    .replaceAll(/_+$/g, "");
  return `${method.toUpperCase()}_${slug}.json`;
}

/** A deep copy with secret-looking fields replaced. */
export function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        SECRET_FIELD.test(k) && typeof v === "string" ? "<scrubbed>" : scrub(v),
      ]),
    );
  return value;
}

/** Throws unless `mode` may send real requests here. */
export function assertLiveAllowed(mode, env = process.env) {
  if ((mode === "live" || mode === "record") && env.GITHUB_ACTIONS !== "true")
    throw new Error(
      `--${mode} runs only in the store-release workflow (a protected GitHub environment); use --dry-run here`,
    );
}

/**
 * `{ call, calls }`: `call({ method, url, headers, body })` → `{ status, json }`. `calls` lists `{ method, path, sent }`
 * for the plan and the tests. A fixture file holds one answer `{ status, json }` or a list consumed in order (the last
 * repeats).
 */
export function createTransport({ mode = "dry-run", fixtures, fetchImpl = globalThis.fetch } = {}) {
  if (!MODES.includes(mode)) throw new Error(`mode must be one of ${MODES.join(", ")}`);
  const calls = [];
  const used = new Map();

  function fromFixture(name) {
    const file = fixtures && join(fixtures, name);
    if (!file || !existsSync(file)) return undefined;
    const data = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(data)) return data;
    const i = used.get(name) ?? 0;
    used.set(name, i + 1);
    return data[Math.min(i, data.length - 1)];
  }

  async function call({ method = "GET", url, headers = {}, body }) {
    method = method.toUpperCase();
    const u = new URL(url);
    const name = fixtureName(method, url);
    const entry = { method, path: `${u.hostname}${u.pathname}${u.search}`, sent: false };
    calls.push(entry);

    if (mode === "replay") {
      const hit = fromFixture(name);
      if (!hit) throw new Error(`replay: no fixture ${name}`);
      return hit;
    }
    if (mode === "dry-run") {
      const hit = fromFixture(name);
      if (hit && !WRITE.has(method)) return hit;
      return WRITE.has(method)
        ? { status: 201, json: { data: { id: "dry-run", type: "dry-run" }, id: "dry-run" } }
        : { status: 200, json: { data: [] } };
    }

    const res = await fetchImpl(url, { method, headers, body });
    entry.sent = true;
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { nonJson: true };
    }
    const answer = { status: res.status, json };
    if (mode === "record" && fixtures) {
      mkdirSync(fixtures, { recursive: true });
      writeFileSync(join(fixtures, name), JSON.stringify(scrub(answer), null, 2) + "\n");
    }
    if (res.status >= 400) {
      // Only the status and the API's machine code: a free-text detail can quote a submitted field (a demo password).
      const code = json?.errors?.[0]?.code ?? json?.error?.status ?? "";
      const err = new Error(`${method} ${u.pathname}: HTTP ${res.status}${code ? ` ${code}` : ""}`);
      err.status = res.status;
      throw err;
    }
    return answer;
  }

  return { call, calls, mode };
}
