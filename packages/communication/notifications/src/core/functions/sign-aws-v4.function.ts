/**
 * Stackra file contract:
 * Purpose: `signAwsV4(request)`, the AWS Signature Version 4 headers (`content-type`, `x-amz-date`, `authorization`) of one JSON
 *          request, for providers outside the managed client's six auth types (ADR 0308 rule 8: a driver signs its own
 *          requests), today Amazon SES.
 * Boundary: Web Crypto only. Signs `content-type`, `host` and `x-amz-date` over the exact body the managed client sends
 *           (`JSON.stringify`). The secret key is used to derive the signing key and never returned or logged.
 * Runtime: isomorphic
 * Governing contract: AWS Signature Version 4; ADR 0308 (rule 8).
 */

const encoder = new TextEncoder();

/** Lower-case hex of `bytes`. */
const hex = (bytes: ArrayBuffer): string =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

/** SHA-256 of `text`, hex. */
const sha256 = async (text: string): Promise<string> =>
  hex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));

/** HMAC-SHA-256 of `text` under `key`. */
async function hmac(key: ArrayBuffer | Uint8Array, text: string): Promise<ArrayBuffer> {
  const imported = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", imported, encoder.encode(text));
}

/**
 * The signed headers of a request.
 *
 * @example
 * const headers = await signAwsV4({ method: "POST", url, body, region, service: "ses", accessKeyId, secretAccessKey, now });
 */
export async function signAwsV4(request: {
  readonly method: string;
  readonly url: URL;
  readonly body: unknown;
  readonly region: string;
  readonly service: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly now: Date;
}): Promise<Readonly<Record<string, string>>> {
  const amzDate = request.now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const payload = request.body === undefined ? "" : JSON.stringify(request.body);
  const contentType = "application/json";
  const query = [...request.url.searchParams.entries()]
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .sort()
    .join("&");
  const canonical = [
    request.method,
    request.url.pathname,
    query,
    `content-type:${contentType}\nhost:${request.url.host}\nx-amz-date:${amzDate}\n`,
    "content-type;host;x-amz-date",
    await sha256(payload),
  ].join("\n");
  const scope = `${day}/${request.region}/${request.service}/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256(canonical)].join("\n");
  let key: ArrayBuffer = await hmac(encoder.encode(`AWS4${request.secretAccessKey}`), day);
  for (const part of [request.region, request.service, "aws4_request"]) key = await hmac(key, part);
  const signature = hex(await hmac(key, toSign));
  return {
    "content-type": contentType,
    "x-amz-date": amzDate,
    authorization: `AWS4-HMAC-SHA256 Credential=${request.accessKeyId}/${scope}, SignedHeaders=content-type;host;x-amz-date, Signature=${signature}`,
  };
}
