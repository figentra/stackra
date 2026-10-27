/**
 * Stackra file contract:
 * Purpose: `loginDirectoryKvRequest(call)`, the Cloudflare KV bulk calls a region's identity service makes to keep its
 *          login directory rows current: `put` writes keys (bulk write, value `1`), `remove` deletes them (bulk delete).
 *          The deployment's `LoginDirectoryStore` driver sends these.
 * Boundary: pure; describes the call, never sends it. The caller sends it with its own KV-scoped API token from its
 *           secret store; no token sits here. Keys only, already hashed (`dir:` prefix), at most Cloudflare's 10,000
 *           per bulk call; a clear identifier is never a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0451; ADR 0353 (decision 4); ADR 0173.
 */
import { CloudflareConfigInvalidError } from "#core/errors/cloudflare-config-invalid.error";

/** A Cloudflare id: no path separator, never empty. */
const ID = /^[A-Za-z0-9_-]+$/;

/** Cloudflare's bulk limit. */
const MAX_KEYS = 10_000;

/**
 * The KV bulk call for `call` on namespace `call.namespaceId`.
 *
 * @throws CloudflareConfigInvalidError when an id is malformed, there are no keys or too many, or a key is not a
 *         directory key.
 * @example
 * loginDirectoryKvRequest({ action: "put", accountId, namespaceId, keys: [`${prefix}eu`] });
 * // { method: "PUT", path: `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/bulk`, body: [{ key, value: "1" }] }
 */
export function loginDirectoryKvRequest(call: {
  readonly action: "put" | "remove";
  readonly accountId: string;
  readonly namespaceId: string;
  readonly keys: readonly string[];
}): { readonly method: "PUT" | "POST"; readonly path: string; readonly body: readonly unknown[] } {
  const issues = [
    ...(ID.test(call.accountId)
      ? []
      : [{ path: "accountId", message: "Expected a Cloudflare account id" }]),
    ...(ID.test(call.namespaceId)
      ? []
      : [{ path: "namespaceId", message: "Expected a KV namespace id" }]),
    ...(call.keys.length > 0 && call.keys.length <= MAX_KEYS
      ? []
      : [{ path: "keys", message: `Expected 1 to ${MAX_KEYS} keys` }]),
    ...call.keys.flatMap((key, index) =>
      key.startsWith("dir:") && key.length <= 512
        ? []
        : [{ path: `keys.${index}`, message: "Expected a login directory key" }],
    ),
  ];
  if (issues.length > 0) throw new CloudflareConfigInvalidError("login directory KV call", issues);

  const path = `/accounts/${call.accountId}/storage/kv/namespaces/${call.namespaceId}/bulk`;
  return call.action === "put"
    ? { method: "PUT", path, body: call.keys.map((key) => ({ key, value: "1" })) }
    : { method: "POST", path: `${path}/delete`, body: [...call.keys] };
}
