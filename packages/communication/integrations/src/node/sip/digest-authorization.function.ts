/**
 * Stackra file contract:
 * Purpose: `digestAuthorization`, the answer to a SIP trunk's digest challenge (`WWW-Authenticate` or
 *          `Proxy-Authenticate`): the `Authorization` or `Proxy-Authorization` value for MD5 or SHA-256, with or
 *          without `qop=auth`.
 * Boundary: a pure function over node:crypto hashes (Web Crypto has no MD5, which most carriers still ask for). The
 *           password is used for the hash only and never returned or logged. `auth-int` and the `-sess` algorithms
 *           are refused as `RangeError`.
 * Runtime: node
 * Governing contract: RFC 3261 (section 22.4); RFC 2617 (section 3.2.2); RFC 7616 (section 3.4); RFC 8760.
 */
import { createHash } from "node:crypto";

import type { DigestRequest } from "#node/sip/digest-request.type";

/** The challenge's algorithm names to node:crypto hash names. */
const HASHES: Readonly<Record<string, string>> = { MD5: "md5", "SHA-256": "sha256" };

/**
 * The header value answering `challenge`.
 *
 * @example
 * const value = digestAuthorization(sipHeaders(response, "Proxy-Authenticate")[0] ?? "", { method: "INVITE", … });
 * @throws RangeError when the challenge is not a digest, has no nonce, or asks for an algorithm or qop not served.
 */
export function digestAuthorization(challenge: string, request: DigestRequest): string {
  if (!/^digest\s/i.test(challenge)) throw new RangeError("not a digest challenge");
  const params = new Map<string, string>();
  for (const match of challenge.slice(6).matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|([^,\s]+))/g))
    params.set((match[1] ?? "").toLowerCase(), match[2] ?? match[3] ?? "");
  const realm = params.get("realm") ?? "";
  const nonce = params.get("nonce");
  if (nonce === undefined) throw new RangeError("the digest challenge has no nonce");
  const algorithm = (params.get("algorithm") ?? "MD5").toUpperCase();
  const hash = HASHES[algorithm];
  if (hash === undefined) throw new RangeError(`digest algorithm ${algorithm} is not served`);
  const qops = (params.get("qop") ?? "").split(",").map((qop) => qop.trim());
  if (params.has("qop") && !qops.includes("auth"))
    throw new RangeError("digest qop other than auth is not served");
  const h = (text: string): string => createHash(hash).update(text).digest("hex");
  const ha1 = h(`${request.username}:${realm}:${request.password}`);
  const ha2 = h(`${request.method}:${request.uri}`);
  const nc = (request.count ?? 1).toString(16).padStart(8, "0");
  const response = params.has("qop")
    ? h(`${ha1}:${nonce}:${nc}:${request.cnonce}:auth:${ha2}`)
    : h(`${ha1}:${nonce}:${ha2}`);
  const parts = [
    `username="${request.username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${request.uri}"`,
    `response="${response}"`,
    `algorithm=${algorithm}`,
  ];
  if (params.has("qop")) parts.push(`cnonce="${request.cnonce}"`, "qop=auth", `nc=${nc}`);
  const opaque = params.get("opaque");
  if (opaque !== undefined) parts.push(`opaque="${opaque}"`);
  return `Digest ${parts.join(", ")}`;
}
