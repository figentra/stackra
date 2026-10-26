/**
 * Stackra file contract:
 * Purpose: `tokenEndpointInit`, the `fetch` init of a form `POST` to an OAuth endpoint (token, revocation), with the
 *          client authenticated by an HTTP Basic header or by form fields, as the Integration declares.
 * Boundary: internal; `requestToken` and `IntegrationRuntime#revoke` call it. A public client (no secret) always sends
 *           its id as a form field; a grant with no client (the JWT bearer grant, RFC 7523) sends neither.
 * Runtime: isomorphic
 * Governing contract: RFC 6749 (section 2.3.1); RFC 7009 (section 2.1).
 */
import { encodeBase64 } from "#core/functions/encode-base64.function";

/**
 * The request init.
 *
 * @example
 * await fetch(auth.tokenUrl, tokenEndpointInit({ grant_type: "client_credentials" }, clientId, clientSecret, "basic"));
 */
export function tokenEndpointInit(
  form: Readonly<Record<string, string>>,
  clientId: string | undefined,
  clientSecret: string | undefined,
  authentication: "basic" | "body",
): RequestInit {
  const body = new URLSearchParams(form);
  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/x-www-form-urlencoded",
  });
  if (clientId === undefined) return { method: "POST", headers, body };
  if (authentication === "basic" && clientSecret !== undefined)
    headers.set(
      "authorization",
      `Basic ${encodeBase64(`${encodeURIComponent(clientId)}:${encodeURIComponent(clientSecret)}`)}`,
    );
  else {
    body.set("client_id", clientId);
    if (clientSecret !== undefined) body.set("client_secret", clientSecret);
  }
  return { method: "POST", headers, body };
}
