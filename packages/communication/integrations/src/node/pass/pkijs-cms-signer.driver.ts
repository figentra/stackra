/**
 * Stackra file contract:
 * Purpose: `PkijsCmsSignerDriver`, the `CmsSigner` over pkijs and Web Crypto: a detached CMS `SignedData` (SHA-256,
 *          RSASSA-PKCS1-v1_5) with the content-type, signing-time and message-digest signed attributes, the signer
 *          identified by issuer and serial, and the signer certificate plus its chain attached.
 * Boundary: reads the PEM certificate, key and chain from the `SecretStore` by the names in `names` at each call
 *           (the Apple Wallet names unless a subclass overrides them; the constructor takes class tokens only, ADR 0294
 *           rule 17); the key is imported non-extractable and never logged or put in an error (a missing secret is
 *           refused by its name only). RSA keys only (Apple pass-type keys are RSA); an HSM or KMS is another
 *           driver of the port. pkijs and asn1js are new catalog entries (stackra-90).
 * Runtime: node
 * Governing contract: ADR 0348 (decision 5); ADR 0173; RFC 5652 (sections 5.3 and 11); R3-SO-17 note in STA-791
 *                     (CmsSigner host port, pkijs).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

import { CmsSigner } from "#contracts/ports/cms-signer.port";
import { APPLE_WALLET_SIGNER_SECRETS } from "#node/pass/apple-wallet-signer-secrets.constant";
import type { CmsSignerSecrets } from "#node/pass/cms-signer-secrets.type";

/** The object identifiers the signature uses. */
const OID = {
  data: "1.2.840.113549.1.7.1",
  signedData: "1.2.840.113549.1.7.2",
  contentType: "1.2.840.113549.1.9.3",
  messageDigest: "1.2.840.113549.1.9.4",
  signingTime: "1.2.840.113549.1.9.5",
} as const;

/** The DER bytes of a PEM block. */
function derOf(pem: string): Uint8Array<ArrayBuffer> {
  const binary = atob(
    pem.replaceAll(/-----(?:BEGIN|END) [A-Z0-9 ]+-----/g, "").replaceAll(/\s+/g, ""),
  );
  // oxlint-disable-next-line unicorn/prefer-code-point -- a binary string: every character is one byte, so the code unit is the byte
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/**
 * Signs with a certificate and key held as secrets.
 *
 * @example
 * const signer = new PkijsCmsSignerDriver(secrets); // the Apple Wallet secret names
 * class OtherSignerDriver extends PkijsCmsSignerDriver {
 *   protected override readonly names = { certificate: "OTHER_CERT", key: "OTHER_KEY", chain: [] };
 * }
 */
export class PkijsCmsSignerDriver extends Driver(CmsSigner) {
  /** The secret names of the certificate, key and chain; a subclass overrides them for another signer. */
  protected readonly names: CmsSignerSecrets = APPLE_WALLET_SIGNER_SECRETS;

  private readonly secrets: SecretStore;

  /**
   * @param secrets - holds the certificate, key and chain under `names`.
   */
  constructor(secrets: SecretStore) {
    super();
    this.secrets = secrets;
  }

  /**
   * The detached signature.
   *
   * @throws TypeError naming the secret when one is not set.
   */
  async sign(content: Uint8Array, signedAt: Date): Promise<Uint8Array> {
    const certificate = pkijs.Certificate.fromBER(derOf(this.secret(this.names.certificate)));
    const chain = this.names.chain.map((name) =>
      pkijs.Certificate.fromBER(derOf(this.secret(name))),
    );
    const key = await crypto.subtle.importKey(
      "pkcs8",
      derOf(this.secret(this.names.key)),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(content));
    const signedData = new pkijs.SignedData({
      version: 1,
      encapContentInfo: new pkijs.EncapsulatedContentInfo({ eContentType: OID.data }),
      signerInfos: [
        new pkijs.SignerInfo({
          version: 1,
          sid: new pkijs.IssuerAndSerialNumber({
            issuer: certificate.issuer,
            serialNumber: certificate.serialNumber,
          }),
          signedAttrs: new pkijs.SignedAndUnsignedAttributes({
            type: 0,
            attributes: [
              new pkijs.Attribute({
                type: OID.contentType,
                values: [new asn1js.ObjectIdentifier({ value: OID.data })],
              }),
              new pkijs.Attribute({
                type: OID.signingTime,
                values: [new asn1js.UTCTime({ valueDate: signedAt })],
              }),
              new pkijs.Attribute({
                type: OID.messageDigest,
                values: [new asn1js.OctetString({ valueHex: digest })],
              }),
            ],
          }),
        }),
      ],
      certificates: [certificate, ...chain],
    });
    // With signed attributes present, pkijs signs their DER encoding, so the content itself is not passed.
    await signedData.sign(key, 0, "SHA-256");
    const info = new pkijs.ContentInfo({
      contentType: OID.signedData,
      content: signedData.toSchema(true),
    });
    return new Uint8Array(info.toSchema().toBER(false));
  }

  /** The value of the secret `name`. */
  private secret(name: string): string {
    const value = this.secrets.get(name);
    if (value === undefined || value === "")
      throw new TypeError(`the CMS signer's secret ${name} is not set`);
    return value;
  }
}
