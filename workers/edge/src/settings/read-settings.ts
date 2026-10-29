/**
 * Stackra file contract:
 * Purpose: `readSettings`: the edge Worker's settings from its vars, the host map included.
 * Boundary: parsing only; the values live in wrangler.jsonc. A missing, malformed or out-of-range var throws a
 *           `RangeError` naming the var, so a misconfigured Worker fails every request instead of guessing.
 * Runtime: worker
 * Governing contract: ADR 0437 (decisions 2 and 6); ADR 0206 (decision 8).
 */
import type { EdgeEnv } from "#src/interfaces/edge-env.interface";
import type { EdgeSettings } from "#src/interfaces/edge-settings.interface";
import type { HostEntry } from "#src/interfaces/host-entry.interface";

/** A required string var. */
const text = (env: EdgeEnv, name: string): string => {
  const value = env[`EDGE_${name}`];
  if (value === undefined || value === "") throw new RangeError(`EDGE_${name} is not set`);
  return String(value);
};

/** A required whole number var, at least `min`. */
const count = (env: EdgeEnv, name: string, min: number): number => {
  const value = Number(text(env, name));
  if (!Number.isInteger(value) || value < min)
    throw new RangeError(`EDGE_${name} must be a whole number of at least ${min}`);
  return value;
};

/** A non-empty string field of a host map entry. */
const field = (entry: Record<string, unknown>, host: string, name: string): string => {
  const value = entry[name];
  if (typeof value !== "string" || value === "" || /[\r\n]/.test(value))
    throw new RangeError(`EDGE_HOST_MAP["${host}"].${name} must be a non-empty one-line string`);
  return value;
};

/** The host map var: a JSON object of hostname to `{ product, surface, realm, scope? }`. */
const hostsOf = (env: EdgeEnv): Record<string, HostEntry> => {
  const map: unknown = JSON.parse(text(env, "HOST_MAP"));
  if (typeof map !== "object" || map === null || Array.isArray(map))
    throw new RangeError("EDGE_HOST_MAP must be a JSON object");
  const hosts: Record<string, HostEntry> = {};
  for (const [host, raw] of Object.entries(map as Record<string, unknown>)) {
    if (typeof raw !== "object" || raw === null)
      throw new RangeError(`EDGE_HOST_MAP["${host}"] must be an object`);
    const entry = raw as Record<string, unknown>;
    hosts[host.toLowerCase()] = {
      product: field(entry, host, "product"),
      surface: field(entry, host, "surface"),
      realm: field(entry, host, "realm"),
      scope:
        entry["scope"] === undefined || entry["scope"] === null
          ? null
          : field(entry, host, "scope"),
    };
  }
  return hosts;
};

/**
 * The edge Worker's settings from its vars.
 *
 * @param env - the Worker environment.
 * @throws RangeError when a var is missing or malformed.
 * @example
 * const settings = readSettings(env); // settings.hosts["app.acme.example"].product === "commerce"
 */
export function readSettings(env: EdgeEnv): EdgeSettings {
  const origin = new URL(text(env, "ORIGIN"));
  if (origin.pathname !== "/" || origin.search !== "")
    throw new RangeError("EDGE_ORIGIN must be scheme://host[:port] with no path");
  return {
    origin: origin.origin,
    hosts: hostsOf(env),
    issuer: text(env, "OIDC_ISSUER"),
    audience: text(env, "OIDC_AUDIENCE"),
    keysSeconds: count(env, "OIDC_KEYS_SECONDS", 60),
    leewaySeconds: count(env, "TOKEN_LEEWAY_SECONDS", 0),
  };
}
