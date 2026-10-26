/**
 * Stackra file contract:
 * Purpose: the `Signer` port: signs bytes with one asymmetric key and hands out its public half, so an audit
 *          checkpoint, a proof bundle or an export manifest carries a signature anyone can check offline with
 *          `verifySignature`.
 * Boundary: an abstract class that is its own token. Drivers: memory (a Web Crypto key pair in process) and `aws-kms`
 *           (the private key never leaves KMS). One algorithm, ES256. The caller decides what bytes to sign (the
 *           canonical JSON of the checkpoint); this port never logs the message or a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 3: a KMS-signed checkpoint); ADR 0416; ADR 0294 (decisions 16 and 17).
 */
import { Port } from "#core/bases/port.base";
import type { Signature } from "#core/types/signature.type";
import type { SignerPublicKey } from "#core/types/signer-public-key.type";

/** Signs with one key. */
export abstract class Signer extends Port {
  /** A detached ES256 signature of `message`. */
  abstract sign(message: Uint8Array): Promise<Signature>;

  /** The public key a verifier checks this signer's signatures with. */
  abstract publicKey(): Promise<SignerPublicKey>;
}
