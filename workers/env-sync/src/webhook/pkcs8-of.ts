/**
 * Stackra file contract:
 * Purpose: `pkcs8Of(pem)`, the PKCS#8 DER of a PEM RSA private key. GitHub hands out App keys as PKCS#1
 *          (`BEGIN RSA PRIVATE KEY`), which WebCrypto cannot import, so a PKCS#1 key is wrapped in the PKCS#8
 *          envelope; a PKCS#8 key is returned as it is.
 * Boundary: pure; never logs the key. Anything that is not a PEM private key gives `undefined`.
 * Runtime: worker
 * Governing contract: STA-2133; RFC 5208 (PKCS#8), RFC 8017 (PKCS#1).
 */

/** The DER AlgorithmIdentifier of rsaEncryption with NULL parameters. */
const RSA_ALGORITHM = Uint8Array.of(
  0x30,
  0x0d,
  0x06,
  0x09,
  0x2a,
  0x86,
  0x48,
  0x86,
  0xf7,
  0x0d,
  0x01,
  0x01,
  0x01,
  0x05,
  0x00,
);

/** One DER element: `tag`, its definite length (up to 65535 bytes, ample for an RSA key), then `body`. */
function der(tag: number, body: Uint8Array): Uint8Array<ArrayBuffer> {
  const n = body.length;
  const length = n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, (n >> 8) & 0xff, n & 0xff];
  const out = new Uint8Array(1 + length.length + n);
  out.set([tag, ...length]);
  out.set(body, 1 + length.length);
  return out;
}

/**
 * The PKCS#8 bytes WebCrypto's `importKey("pkcs8", …)` takes.
 *
 * @example
 * pkcs8Of(env.STACKRA_BOT_PRIVATE_KEY ?? ""); // a DER SEQUENCE, or undefined for anything else
 */
export function pkcs8Of(pem: string): Uint8Array<ArrayBuffer> | undefined {
  // A key stored on one line keeps its newlines as `\n` escapes.
  const match = /-----BEGIN (RSA )?PRIVATE KEY-----([\s\S]+?)-----END/.exec(
    pem.replaceAll("\\n", "\n"),
  );
  if (match === null) return undefined;
  let raw: string;
  try {
    raw = atob((match[2] ?? "").replaceAll(/\s/g, ""));
  } catch {
    return undefined;
  }
  const bytes = Uint8Array.from(raw, (c) => c.codePointAt(0) ?? 0);
  if (match[1] === undefined) return bytes;
  const version = Uint8Array.of(0x02, 0x01, 0x00);
  const octets = der(0x04, bytes);
  const body = new Uint8Array(version.length + RSA_ALGORITHM.length + octets.length);
  body.set(version);
  body.set(RSA_ALGORITHM, version.length);
  body.set(octets, version.length + RSA_ALGORITHM.length);
  return der(0x30, body);
}
