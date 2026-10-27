/**
 * Stackra file contract:
 * Purpose: `XadesEnvelopeSignerDriver`, the `FiscalSigner` that makes the UBL enveloped XAdES signature (the ZATCA
 *          shape): it builds `ext:UBLExtensions` with `ds:Signature` (the invoice digest and the signed-properties
 *          digest, the signature value, the certificate, `xades:SignedProperties` with the signing time and the
 *          certificate digest and issuer serial) and the `cac:Signature` marker, and has the host's
 *          `FiscalSigningKey` sign the invoice hash.
 * Boundary: a driver of `FiscalSigner` for format `xades` only; any other format is refused. The host binds only a
 *           key (an HSM, a token, an encrypted key) and its certificate facts; the private key never reaches this
 *           package. The XML algorithm and transform URIs are the format's. The time comes in
 *           `SignatureRequest.signedAt`, so nothing here reads a clock. Not yet certified against the ZATCA sandbox
 *           (stackra-31): the digest encodings follow the ZATCA security standard as written.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4; build-wave10 not-built item 5: the XAdES envelope); ADR 0173 (secrets
 *                     stay with the host).
 */
import { Driver } from "@stackra/container";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { FiscalSigningKey } from "#contracts/ports/fiscal-signing-key.port";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import type { SignatureResult } from "#contracts/types/signature-result.type";
import type { SigningCertificate } from "#contracts/types/signing-certificate.type";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalSignatureUnsupportedError } from "#core/errors/fiscal-signature-unsupported.error";
import { fromBase64 } from "#core/functions/from-base64.function";
import { renderXml } from "#core/functions/render-xml.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { toHex } from "#core/functions/to-hex.function";
import { xmlElement as el } from "#core/functions/xml-element.function";
import type { XmlNode } from "#core/types/xml-node.type";

/** The enveloped XAdES profile URI of UBL signatures. */
const ENVELOPED = "urn:oasis:names:specification:ubl:dsig:enveloped:xades";
/** The UBL signature ids. */
const SIGNATURE_ID = "urn:oasis:names:specification:ubl:signature:1";
const REFERENCED_ID = "urn:oasis:names:specification:ubl:signature:Invoice";
/** XML-DSig and XAdES algorithm URIs. */
const C14N11 = "http://www.w3.org/2006/12/xml-c14n11";
const ECDSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256";
const SHA256 = "http://www.w3.org/2001/04/xmlenc#sha256";
const XPATH = "http://www.w3.org/TR/1999/REC-xpath-19991116";
/** The parts of the invoice the invoice digest leaves out. */
const EXCLUDED = [
  "not(//ancestor-or-self::ext:UBLExtensions)",
  "not(//ancestor-or-self::cac:Signature)",
  "not(//ancestor-or-self::cac:AdditionalDocumentReference[cbc:ID='QR'])",
];

/** A `ds:DigestMethod` with SHA-256. */
const digestMethod = (): XmlNode => el("ds:DigestMethod", { Algorithm: SHA256 });

/** The signed properties: signing time, certificate digest and issuer serial. */
function signedProperties(time: string, certDigest: string, cert: SigningCertificate): XmlNode {
  return el(
    "xades:SignedProperties",
    { Id: "xadesSignedProperties" },
    el(
      "xades:SignedSignatureProperties",
      {},
      el("xades:SigningTime", {}, time),
      el(
        "xades:SigningCertificate",
        {},
        el(
          "xades:Cert",
          {},
          el("xades:CertDigest", {}, digestMethod(), el("ds:DigestValue", {}, certDigest)),
          el(
            "xades:IssuerSerial",
            {},
            el("ds:X509IssuerName", {}, cert.issuerName),
            el("ds:X509SerialNumber", {}, cert.serialNumber),
          ),
        ),
      ),
    ),
  );
}

/**
 * A `FiscalSigner` that envelopes UBL invoices in XAdES with the unit's key.
 *
 * @example
 * new ZatcaDriver(new XadesEnvelopeSignerDriver(key), transport);
 */
export class XadesEnvelopeSignerDriver extends Driver(FiscalSigner) {
  /** Holds each unit's private key and certificate. */
  private readonly key: FiscalSigningKey;

  /**
   * @param key - the host's key store.
   */
  constructor(key: FiscalSigningKey) {
    super();
    this.key = key;
  }

  /**
   * The signed invoice: `ext:UBLExtensions` first inside the root, `cac:Signature` before the supplier party.
   *
   * @throws FiscalSignatureUnsupportedError when the format is not `xades`.
   * @throws FiscalDocumentInvalidError when the request has no `signedAt`.
   * @throws FiscalCredentialMissingError when the unit has no certificate.
   */
  async sign(request: SignatureRequest): Promise<SignatureResult> {
    const { unitId } = request;
    if (request.format !== SignatureFormat.Xades)
      throw FiscalSignatureUnsupportedError.create({ unitId, format: request.format });
    if (!request.signedAt)
      throw FiscalDocumentInvalidError.create({ driver: "xades", field: "signedAt" });
    const cert = await this.key.certificate(unitId);
    if (!cert) throw FiscalCredentialMissingError.create({ unitId, driver: "xades" });

    // ZATCA digests the certificate and the signed properties as base64 of the hex SHA-256.
    const certDigest = toBase64(toHex(await sha256(cert.certificate)));
    const properties = signedProperties(
      request.signedAt.toISOString().slice(0, 19),
      certDigest,
      cert,
    );
    const propertiesDigest = toBase64(toHex(await sha256(renderXml(properties))));
    const value = await this.key.sign(unitId, fromBase64(request.digest));

    const signature = el(
      "ds:Signature",
      { "xmlns:ds": "http://www.w3.org/2000/09/xmldsig#", Id: "signature" },
      el(
        "ds:SignedInfo",
        {},
        el("ds:CanonicalizationMethod", { Algorithm: C14N11 }),
        el("ds:SignatureMethod", { Algorithm: ECDSA_SHA256 }),
        el(
          "ds:Reference",
          { Id: "invoiceSignedData", URI: "" },
          el(
            "ds:Transforms",
            {},
            ...EXCLUDED.map((path) =>
              el("ds:Transform", { Algorithm: XPATH }, el("ds:XPath", {}, path)),
            ),
            el("ds:Transform", { Algorithm: C14N11 }),
          ),
          digestMethod(),
          el("ds:DigestValue", {}, request.digest),
        ),
        el(
          "ds:Reference",
          {
            Type: "http://www.w3.org/2000/09/xmldsig#SignatureProperties",
            URI: "#xadesSignedProperties",
          },
          digestMethod(),
          el("ds:DigestValue", {}, propertiesDigest),
        ),
      ),
      el("ds:SignatureValue", {}, value),
      el("ds:KeyInfo", {}, el("ds:X509Data", {}, el("ds:X509Certificate", {}, cert.certificate))),
      el(
        "ds:Object",
        {},
        el(
          "xades:QualifyingProperties",
          { "xmlns:xades": "http://uri.etsi.org/01903/v1.3.2#", Target: "signature" },
          properties,
        ),
      ),
    );
    const extensions = renderXml(
      el(
        "ext:UBLExtensions",
        {},
        el(
          "ext:UBLExtension",
          {},
          el("ext:ExtensionURI", {}, ENVELOPED),
          el(
            "ext:ExtensionContent",
            {},
            el(
              "sig:UBLDocumentSignatures",
              {
                "xmlns:sac":
                  "urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2",
                "xmlns:sbc":
                  "urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2",
                "xmlns:sig":
                  "urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2",
              },
              el(
                "sac:SignatureInformation",
                {},
                el("cbc:ID", {}, SIGNATURE_ID),
                el("sbc:ReferencedSignatureID", {}, REFERENCED_ID),
                signature,
              ),
            ),
          ),
        ),
      ),
    );
    const marker = renderXml(
      el(
        "cac:Signature",
        {},
        el("cbc:ID", {}, REFERENCED_ID),
        el("cbc:SignatureMethod", {}, ENVELOPED),
      ),
    );
    const root = /^(?:<\?[^>]*\?>\s*)?<[^>]+>/.exec(request.payload)?.[0] ?? "";
    let signed = root + extensions + request.payload.slice(root.length);
    const supplier = "<cac:AccountingSupplierParty>";
    signed = signed.includes(supplier)
      ? signed.replace(supplier, marker + supplier)
      : signed.replace(/<\/[^>]+>$/, (end) => marker + end);
    return {
      value,
      signedPayload: signed,
      publicKey: cert.publicKey,
      certificateSignature: cert.certificateSignature,
    };
  }
}
