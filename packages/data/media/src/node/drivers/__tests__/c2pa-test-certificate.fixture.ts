/**
 * Stackra file contract:
 * Purpose: `c2paTestCertificate()`, a throwaway ES256 certificate chain (a test CA and the signing certificate it
 *          issued) and the signing key, made with node:crypto when a test runs, for the real C2PA round trip.
 * Boundary: test data only. The keys live in memory for one test run and are never written to a file; nothing signed
 *           with them is trusted anywhere. The signing certificate follows the C2PA 2.x certificate profile c2pa-rs
 *           checks (v3, not self-signed, critical key usage `digitalSignature`, extended key usage
 *           `emailProtection`, subject and authority key identifiers).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0173 (no committed key); COM-73, COM-294; STA-2781.
 */
import { createHash, generateKeyPairSync, randomBytes, sign, type KeyObject } from "node:crypto";

/** A certificate chain (PEM, signing certificate first) and its private key (PKCS #8 PEM). */
interface C2paTestCertificate {
  readonly certificate: string;
  readonly key: string;
}

/** One DER element: `tag`, its definite length, then `content`. */
function der(tag: number, ...content: readonly Buffer[]): Buffer {
  const body = Buffer.concat(content);
  const length =
    body.length < 0x80
      ? Buffer.from([body.length])
      : (() => {
          const bytes: number[] = [];
          for (let rest = body.length; rest > 0; rest >>= 8) bytes.unshift(rest & 0xff);
          return Buffer.from([0x80 | bytes.length, ...bytes]);
        })();
  return Buffer.concat([Buffer.from([tag]), length, body]);
}

const sequence = (...content: readonly Buffer[]): Buffer => der(0x30, ...content);
const octets = (content: Buffer): Buffer => der(0x04, content);

/** An OBJECT IDENTIFIER from its dotted form. */
function oid(dotted: string): Buffer {
  const [first = 0, second = 0, ...rest] = dotted.split(".").map(Number);
  const bytes = [40 * first + second];
  for (const arc of rest) {
    const base128 = [arc & 0x7f];
    for (let value = arc >> 7; value > 0; value >>= 7) base128.unshift(0x80 | (value & 0x7f));
    bytes.push(...base128);
  }
  return der(0x06, Buffer.from(bytes));
}

/** A positive INTEGER from big-endian bytes. */
function integer(bytes: Buffer): Buffer {
  return der(0x02, (bytes[0] ?? 0) & 0x80 ? Buffer.concat([Buffer.from([0]), bytes]) : bytes);
}

/** A UTCTime (`YYMMDDHHMMSSZ`). */
function utcTime(at: Date): Buffer {
  const iso = at.toISOString();
  const text = `${iso.slice(2, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;
  return der(0x17, Buffer.from(text, "ascii"));
}

/** A distinguished name: organisation, then common name. */
function name(commonName: string): Buffer {
  const attribute = (type: string, value: string): Buffer =>
    der(0x31, sequence(oid(type), der(0x0c, Buffer.from(value, "utf8"))));
  return sequence(attribute("2.5.4.10", "Stackra test"), attribute("2.5.4.3", commonName));
}

/** One extension: id, criticality, DER value. */
function extension(id: string, critical: boolean, value: Buffer): Buffer {
  return critical
    ? sequence(oid(id), der(0x01, Buffer.from([0xff])), octets(value))
    : sequence(oid(id), octets(value));
}

/** The key identifier of a public key (SHA-1 of its SubjectPublicKeyInfo, RFC 5280 §4.2.1.2 style). */
function keyIdentifier(publicKey: KeyObject): Buffer {
  return createHash("sha1")
    .update(publicKey.export({ type: "spki", format: "der" }))
    .digest();
}

const ECDSA_WITH_SHA256 = sequence(oid("1.2.840.10045.4.3.2"));

interface Issue {
  readonly subject: string;
  readonly subjectKey: KeyObject;
  readonly issuer: string;
  readonly issuerKey: KeyObject;
  readonly issuerPrivateKey: KeyObject;
  readonly authority: boolean;
}

/** A DER X.509 v3 certificate for `subjectKey`, signed by the issuer with ECDSA P-256 / SHA-256. */
function certificate({
  subject,
  subjectKey,
  issuer,
  issuerKey,
  issuerPrivateKey,
  authority,
}: Issue): Buffer {
  const now = Date.now();
  const serial = randomBytes(16);
  serial[0] = ((serial[0] ?? 0) & 0x7f) | 0x01;
  const extensions = authority
    ? [
        extension("2.5.29.19", true, sequence(der(0x01, Buffer.from([0xff])))),
        // keyCertSign and cRLSign: bits 5 and 6, one unused bit.
        extension("2.5.29.15", true, der(0x03, Buffer.from([0x01, 0x06]))),
        extension("2.5.29.14", false, octets(keyIdentifier(subjectKey))),
      ]
    : [
        extension("2.5.29.19", true, sequence()),
        // digitalSignature: bit 0, seven unused bits.
        extension("2.5.29.15", true, der(0x03, Buffer.from([0x07, 0x80]))),
        extension("2.5.29.37", false, sequence(oid("1.3.6.1.5.5.7.3.4"))),
        extension("2.5.29.14", false, octets(keyIdentifier(subjectKey))),
        extension("2.5.29.35", false, sequence(der(0x80, keyIdentifier(issuerKey)))),
      ];
  const tbs = sequence(
    der(0xa0, integer(Buffer.from([2]))),
    integer(serial),
    ECDSA_WITH_SHA256,
    name(issuer),
    sequence(utcTime(new Date(now - 86_400_000)), utcTime(new Date(now + 86_400_000))),
    name(subject),
    subjectKey.export({ type: "spki", format: "der" }),
    der(0xa3, sequence(...extensions)),
  );
  const signature = sign("sha256", tbs, issuerPrivateKey);
  return sequence(tbs, ECDSA_WITH_SHA256, der(0x03, Buffer.concat([Buffer.from([0]), signature])));
}

/** PEM armour for a DER certificate. */
function pem(certificateDer: Buffer): string {
  const lines = certificateDer.toString("base64").match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----\n`;
}

/**
 * A fresh ES256 signing certificate issued by a fresh test CA, with the signing key.
 *
 * @example
 * const { certificate, key } = c2paTestCertificate();
 */
export function c2paTestCertificate(): C2paTestCertificate {
  const ca = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const signer = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const caName = "Stackra C2PA test CA";
  const caCertificate = certificate({
    subject: caName,
    subjectKey: ca.publicKey,
    issuer: caName,
    issuerKey: ca.publicKey,
    issuerPrivateKey: ca.privateKey,
    authority: true,
  });
  const signingCertificate = certificate({
    subject: "Stackra C2PA test signer",
    subjectKey: signer.publicKey,
    issuer: caName,
    issuerKey: ca.publicKey,
    issuerPrivateKey: ca.privateKey,
    authority: false,
  });
  return {
    certificate: pem(signingCertificate) + pem(caCertificate),
    key: signer.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}
