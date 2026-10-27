/**
 * Stackra file contract:
 * Purpose: `installSigner`, the on-prem install's `Signer`: the install key from its secret store (the JWK text
 *          `generateInstallKey` made), as a `MemorySignerDriver` that signs its usage reports.
 * Boundary: imports the private key non-extractable, so it cannot leave the process again; the public half is rebuilt
 *           from the JWK's `x` and `y`. A text that is not a P-256 private JWK is refused with a `RangeError` that
 *           never quotes the text.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5); ADR 0173; ADR 0416; OS licensing SPEC open question 2.
 */
import { MemorySignerDriver, type Signer } from "@stackra/contracts";
import { isRecord } from "@stackra/support";

/** The Web Crypto algorithm of ES256. */
const ES256 = { name: "ECDSA", namedCurve: "P-256" } as const;

/**
 * The install's signer over `privateKey`.
 *
 * @throws RangeError when `keyId` is empty or `privateKey` is not a P-256 private JWK.
 * @example
 * const signer = await installSigner("acme-onprem-1", secrets.LICENSING_INSTALL_KEY);
 */
export async function installSigner(keyId: string, privateKey: string): Promise<Signer> {
  let jwk: unknown;
  try {
    jwk = JSON.parse(privateKey);
  } catch {
    jwk = undefined;
  }
  if (
    !isRecord(jwk) ||
    jwk.kty !== "EC" ||
    jwk.crv !== "P-256" ||
    typeof jwk.d !== "string" ||
    typeof jwk.x !== "string" ||
    typeof jwk.y !== "string"
  )
    throw new RangeError("the install key is not a P-256 private JWK");
  const { kty, crv, x, y, d } = jwk;
  try {
    const keys = {
      privateKey: await globalThis.crypto.subtle.importKey(
        "jwk",
        { kty, crv, x, y, d },
        ES256,
        false,
        ["sign"],
      ),
      publicKey: await globalThis.crypto.subtle.importKey("jwk", { kty, crv, x, y }, ES256, true, [
        "verify",
      ]),
    };
    return new MemorySignerDriver(keyId, keys);
  } catch (error) {
    if (error instanceof RangeError) throw error;
    throw new RangeError("the install key is not a P-256 private JWK");
  }
}
