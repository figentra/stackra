/**
 * Stackra file contract:
 * Purpose: `SigningCertificate`, the public facts of a unit's signing certificate an XAdES envelope and a receipt QR
 *          carry: the certificate, its issuer and serial, the public key and the issuer's signature over it.
 * Boundary: a type only; what `FiscalSigningKey.certificate` answers. Public material only: the private key never
 *           leaves the host's key store. The host reads these from the certificate it holds (a CSID), so this package
 *           parses no X.509.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0173 (secrets stay with the host).
 */

/** A signing certificate's public facts. */
export type SigningCertificate = {
  /** The certificate, base64 DER, as `ds:X509Certificate` carries it. */
  readonly certificate: string;
  /** The issuer's distinguished name, as `ds:X509IssuerName` carries it. */
  readonly issuerName: string;
  /** The serial number in decimal, as `ds:X509SerialNumber` carries it. */
  readonly serialNumber: string;
  /** The subject public key, base64 DER. */
  readonly publicKey: string;
  /** The issuer's signature over the certificate, base64; `null` when the mandate's QR does not carry it. */
  readonly certificateSignature: string | null;
};
