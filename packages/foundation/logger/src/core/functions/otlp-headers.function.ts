/**
 * Stackra file contract:
 * Purpose: `otlpHeaders(text)`, the request headers of the OpenTelemetry `OTEL_EXPORTER_OTLP_HEADERS` form
 *          (`k=v,k2=v2`, values percent-encoded), so the collector's credentials stay one secret.
 * Boundary: pure; a pair without `=` or with an empty name is skipped, never echoed. The result holds the secret's
 *           values: the reporter keeps it in memory and never logs it.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (secrets by name); the OpenTelemetry exporter environment specification.
 */

/**
 * Parses the headers text.
 *
 * @example
 * otlpHeaders("authorization=Bearer%20abc,x-team=ops"); // { authorization: "Bearer abc", "x-team": "ops" }
 */
export function otlpHeaders(text: string | undefined): Readonly<Record<string, string>> {
  const headers: Record<string, string> = {};
  for (const pair of (text ?? "").split(",")) {
    const at = pair.indexOf("=");
    const name = pair.slice(0, at).trim().toLowerCase();
    if (at < 0 || name === "") continue;
    try {
      headers[name] = decodeURIComponent(pair.slice(at + 1).trim());
    } catch {
      headers[name] = pair.slice(at + 1).trim();
    }
  }
  return headers;
}
