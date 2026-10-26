/**
 * Stackra file contract:
 * Purpose: `egressOf`, an Integration's egress allow-list entry derived from its `baseUrl`: the https origin the
 *          managed client may call, and the credential-set fields its host is filled from when the provider runs per
 *          region (`https://{region}.api.example.com`). A `{field}` host is data: the entry allows the origin the
 *          connection's own credential set names, never any host.
 * Boundary: pure. Undefined for a base URL the managed client would refuse: not https, a placeholder outside the
 *           host, a field that is not camelCase, credentials, a query or a fragment in the URL, or an empty static
 *           host part, so the manifest never holds an entry the runtime cannot honour.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 19: the egress allow-list is derived and locked; rule 13: the managed client);
 *                     STA-768.
 */

/** A `{field}` placeholder. */
const PLACEHOLDER = /\{([^{}]*)\}/g;

/** A credential-set field name. */
const FIELD = /^[a-z][A-Za-z0-9]*$/;

/**
 * The egress entry of `baseUrl`, or undefined when it is not a base URL the managed client accepts.
 *
 * @example
 * egressOf("https://api.stripe.com/v1"); // { origin: "https://api.stripe.com", fields: [] }
 * egressOf("https://{region}.api.example.com"); // { origin: "https://{region}.api.example.com", fields: ["region"] }
 */
export function egressOf(
  baseUrl: string,
): { readonly origin: string; readonly fields: readonly string[] } | undefined {
  const match = /^https:\/\/([^/?#]+)([^?#]*)$/.exec(baseUrl);
  if (match === null) return undefined;
  const [, host = "", path = ""] = match;
  if (path.includes("{") || path.includes("}") || host.includes("@")) return undefined;
  const fields = [...host.matchAll(PLACEHOLDER)].map((found) => found[1] ?? "");
  if (fields.some((field) => !FIELD.test(field))) return undefined;
  const sample = host.replace(PLACEHOLDER, "x");
  if (sample.includes("{") || sample.includes("}")) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(`https://${sample}`);
  } catch {
    return undefined;
  }
  if (parsed.hostname === "" || parsed.username !== "" || parsed.password !== "") return undefined;
  // Static host parts are case-insensitive; the field names keep their case.
  const origin = host
    .split(/(\{[^{}]*\})/)
    .map((part) => (part.startsWith("{") ? part : part.toLowerCase()))
    .join("");
  return { origin: `https://${origin}`, fields: [...new Set(fields)] };
}
