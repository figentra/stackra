/**
 * Stackra file contract:
 * Purpose: the `CmsSigner` host port: one detached CMS (PKCS #7) `SignedData` signature over a byte string, signed
 *          with the deployment's certificate and key and carrying the certificate chain. The Apple Wallet `.pkpass`
 *          signature is its first user.
 * Boundary: an abstract class that is its own token. The host binds the driver (the pkijs one in `./node`, an HSM or
 *           a KMS driver), so the private key never reaches a caller. The signing time is an argument, so nothing
 *           here reads a clock. Leaf types only, so it lives in `./contracts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5: pass certificates are deployment secrets); ADR 0173 (nobody reads a
 *                     secret's value); RFC 5652 (CMS SignedData, detached content).
 */
import { Port } from "@stackra/contracts";

/**
 * Signs bytes as a detached CMS signature.
 *
 * @example
 * const signature = await this.signer.sign(manifestBytes, request.issuedAt);
 */
export abstract class CmsSigner extends Port {
  /**
   * The DER bytes of a `ContentInfo` holding a detached `SignedData` over `content`, SHA-256, with the content-type,
   * signing-time and message-digest signed attributes and the signer's certificate chain.
   */
  abstract sign(content: Uint8Array, signedAt: Date): Promise<Uint8Array>;
}
