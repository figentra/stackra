/**
 * Stackra file contract:
 * Purpose: `CadesSignerDriver`, the `FiscalSigner` that makes a detached CAdES-BES signature (the ETA shape): a CMS
 *          `SignedData` over the request's digest whose signed attributes are the content type, the message digest,
 *          the signing certificate (`ESSCertIDv2`, SHA-256) and, when the request carries one, the signing time; the
 *          host's `FiscalSigningKey` signs those attributes and the certificate travels in the envelope.
 * Boundary: a driver of `FiscalSigner` for format `cades` only; any other format is refused. The host binds only a key
 *           (a token, an HSM or a cloud e-seal provider) and its certificate facts; the private key never reaches this
 *           package. RSA (`sha256WithRSAEncryption`) and EC (`ecdsa-with-SHA256`) keys, read from the certificate's
 *           public key. The time comes in `SignatureRequest.signedAt`, so nothing here reads a clock. Not yet
 *           certified against the ETA preprod system (stackra-31).
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0173 (secrets stay with the host); RFC 5652 (CMS), RFC 5035
 *                     (ESSCertIDv2), ETSI EN 319 122-1 (CAdES-BES).
 */
import { Driver } from "@stackra/container";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { FiscalSigningKey } from "#contracts/ports/fiscal-signing-key.port";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import type { SignatureResult } from "#contracts/types/signature-result.type";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalSignatureUnsupportedError } from "#core/errors/fiscal-signature-unsupported.error";
import { derChildren } from "#core/functions/der-children.function";
import { derElement } from "#core/functions/der-element.function";
import { fromBase64 } from "#core/functions/from-base64.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";

/** Bytes of a hex string; for the fixed encodings below. */
const bytes = (hex: string): Uint8Array =>
  Uint8Array.from({ length: hex.length / 2 }, (_, at) =>
    Number.parseInt(hex.slice(at * 2, at * 2 + 2), 16),
  );

/** The DER tags this envelope uses. */
const SEQUENCE = 0x30;
const SET = 0x31;
const INTEGER = 0x02;
const OCTET_STRING = 0x04;
const UTC_TIME = 0x17;
const GENERALIZED_TIME = 0x18;
const CONTEXT_0 = 0xa0;

/** Encoded object identifiers (tag and length included). */
const ID_DATA = bytes("06092a864886f70d010701");
const ID_SIGNED_DATA = bytes("06092a864886f70d010702");
const ID_CONTENT_TYPE = bytes("06092a864886f70d010903");
const ID_MESSAGE_DIGEST = bytes("06092a864886f70d010904");
const ID_SIGNING_TIME = bytes("06092a864886f70d010905");
const ID_SIGNING_CERTIFICATE_V2 = bytes("060b2a864886f70d010910022f");
const RSA_ENCRYPTION = bytes("06092a864886f70d010101");
const EC_PUBLIC_KEY = bytes("06072a8648ce3d0201");

/** Algorithm identifiers: SHA-256 without parameters (RFC 5754), and the two signature algorithms. */
const SHA256 = derElement(SEQUENCE, bytes("0609608648016503040201"));
const SHA256_WITH_RSA = derElement(SEQUENCE, bytes("06092a864886f70d01010b"), bytes("0500"));
const ECDSA_WITH_SHA256 = derElement(SEQUENCE, bytes("06082a8648ce3d040302"));

/** Version 1: the signer is named by issuer and serial number. */
const VERSION_1 = bytes("020101");

/** Whether two encodings are the same bytes. */
const same = (left: Uint8Array | undefined, right: Uint8Array): boolean =>
  left !== undefined &&
  left.length === right.length &&
  left.every((byte, at) => byte === right[at]);

/** DER's order for a SET OF: the encodings compared as octet strings, the shorter padded with zeros. */
function derOrder(left: Uint8Array, right: Uint8Array): number {
  for (let at = 0; at < Math.max(left.length, right.length); at += 1) {
    const diff = (left[at] ?? 0) - (right[at] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** One signed attribute: its type and a set of one value. */
const attribute = (type: Uint8Array, value: Uint8Array): Uint8Array =>
  derElement(SEQUENCE, type, derElement(SET, value));

/** `at` as UTCTime through 2049 and GeneralizedTime after, to the second, in UTC (RFC 5280 rules). */
function time(at: Date): Uint8Array {
  const iso = at.toISOString();
  const digits = `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;
  const utc = at.getUTCFullYear() < 2050;
  return derElement(
    utc ? UTC_TIME : GENERALIZED_TIME,
    new TextEncoder().encode(utc ? digits.slice(2) : digits),
  );
}

/** The parts of a certificate the envelope names: issuer, serial number and the signature algorithm its key needs. */
type CertificateParts = {
  readonly issuer: Uint8Array;
  readonly serial: Uint8Array;
  readonly algorithm: Uint8Array;
};

/** The issuer, serial and signature algorithm of `certificate` (DER), or `null` when it does not parse. */
function partsOf(certificate: Uint8Array): CertificateParts | null {
  const [tbs] = derChildren(certificate) ?? [];
  const fields = tbs === undefined ? null : derChildren(tbs);
  if (fields === null) return null;
  // the explicit version tag is optional (v1 certificates leave it out)
  const [serial, , issuer, , , publicKey] = fields[0]?.[0] === CONTEXT_0 ? fields.slice(1) : fields;
  const [keyAlgorithm] = publicKey === undefined ? [] : (derChildren(publicKey) ?? []);
  const [keyType] = keyAlgorithm === undefined ? [] : (derChildren(keyAlgorithm) ?? []);
  if (serial?.[0] !== INTEGER || issuer?.[0] !== SEQUENCE) return null;
  if (same(keyType, RSA_ENCRYPTION)) return { issuer, serial, algorithm: SHA256_WITH_RSA };
  if (same(keyType, EC_PUBLIC_KEY)) return { issuer, serial, algorithm: ECDSA_WITH_SHA256 };
  return null;
}

/**
 * A `FiscalSigner` that seals with a detached CAdES-BES signature by the unit's key.
 *
 * @example
 * new EtaDriver(new CadesSignerDriver(key), transport);
 */
export class CadesSignerDriver extends Driver(FiscalSigner) {
  /** Holds each unit's key and certificate. */
  private readonly key: FiscalSigningKey;

  /**
   * @param key - the host's key store (a token, an HSM or an e-seal provider).
   */
  constructor(key: FiscalSigningKey) {
    super();
    this.key = key;
  }

  /**
   * The CMS `ContentInfo` (base64 DER) of a detached signature over `request.digest`.
   *
   * @throws FiscalSignatureUnsupportedError when the format is not `cades`.
   * @throws FiscalCredentialMissingError when the unit has no certificate, or one that is not an RSA or EC
   *         certificate in DER.
   */
  async sign(request: SignatureRequest): Promise<SignatureResult> {
    const { unitId } = request;
    if (request.format !== SignatureFormat.Cades)
      throw FiscalSignatureUnsupportedError.create({ unitId, format: request.format });
    const cert = await this.key.certificate(unitId);
    const certificate = cert === null ? null : fromBase64(cert.certificate);
    const parts = certificate === null ? null : partsOf(certificate);
    if (certificate === null || parts === null)
      throw FiscalCredentialMissingError.create({ unitId, driver: "cades" });

    const essCertIdV2 = derElement(SEQUENCE, derElement(OCTET_STRING, await sha256(certificate)));
    const attributes = [
      attribute(ID_CONTENT_TYPE, ID_DATA),
      attribute(ID_MESSAGE_DIGEST, derElement(OCTET_STRING, fromBase64(request.digest))),
      attribute(ID_SIGNING_CERTIFICATE_V2, derElement(SEQUENCE, derElement(SEQUENCE, essCertIdV2))),
      ...(request.signedAt ? [attribute(ID_SIGNING_TIME, time(request.signedAt))] : []),
    ].toSorted(derOrder);
    // the key signs the attributes as a SET; the envelope carries them under [0] IMPLICIT
    const signature = await this.key.sign(unitId, derElement(SET, ...attributes));

    const signerInfo = derElement(
      SEQUENCE,
      VERSION_1,
      derElement(SEQUENCE, parts.issuer, parts.serial),
      SHA256,
      derElement(CONTEXT_0, ...attributes),
      parts.algorithm,
      derElement(OCTET_STRING, fromBase64(signature)),
    );
    const signedData = derElement(
      SEQUENCE,
      VERSION_1,
      derElement(SET, SHA256),
      derElement(SEQUENCE, ID_DATA),
      derElement(CONTEXT_0, certificate),
      derElement(SET, signerInfo),
    );
    const contentInfo = derElement(SEQUENCE, ID_SIGNED_DATA, derElement(CONTEXT_0, signedData));
    return {
      value: toBase64(contentInfo),
      signedPayload: null,
      publicKey: null,
      certificateSignature: null,
    };
  }
}
