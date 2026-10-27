/**
 * Stackra file contract:
 * Purpose: `InstallKey`, a fresh on-prem install key as `generateInstallKey` returns it: the private half to store as
 *          the install's secret and the public half to register on the licence.
 * Boundary: a type only. `privateKey` is a secret: it goes straight into the install's secret store and is never
 *           logged, sent or committed. `publicKey` is public and is what the operator registers
 *           (`licences.licence.register_install` in OS).
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5); ADR 0173 (secrets); ADR 0416.
 */
import type { SignerPublicKey } from "@stackra/contracts";

/** An install's ES256 key pair. */
export interface InstallKey {
  /** The private key as JWK JSON text; the install's secret. */
  readonly privateKey: string;

  /** The public key to register on the licence. */
  readonly publicKey: SignerPublicKey;
}
