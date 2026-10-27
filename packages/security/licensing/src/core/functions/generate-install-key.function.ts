/**
 * Stackra file contract:
 * Purpose: `generateInstallKey`, makes an on-prem install's ES256 key once, at install time: the private JWK the install
 *          keeps as its secret and the public key its operator registers on the licence.
 * Boundary: Web Crypto only. The private key leaves this function exactly once, as the returned JWK text, for the
 *           caller to put straight into the install's secret store; nothing here logs or stores it. The public key is
 *           `MemorySignerDriver.publicKey()` of the pair, the exact form `verifySignature` reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5); ADR 0173 (secrets); ADR 0416 (ES256 signatures).
 */
import { MemorySignerDriver } from "@stackra/contracts";

import type { InstallKey } from "#core/types/install-key.type";

/**
 * A fresh install key named `keyId`.
 *
 * @throws RangeError when `keyId` is empty.
 * @example
 * const { privateKey, publicKey } = await generateInstallKey("acme-onprem-1");
 * // privateKey -> the install's LICENSING_INSTALL_KEY secret; publicKey -> the operator registers it
 */
export async function generateInstallKey(keyId: string): Promise<InstallKey> {
  if (keyId === "") throw new RangeError("an install key needs a key id");
  const keys = await globalThis.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const privateKey = await globalThis.crypto.subtle.exportKey("jwk", keys.privateKey);
  return {
    privateKey: JSON.stringify(privateKey),
    publicKey: await new MemorySignerDriver(keyId, keys).publicKey(),
  };
}
