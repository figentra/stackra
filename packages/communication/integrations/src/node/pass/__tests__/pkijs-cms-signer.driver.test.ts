/**
 * Stackra file contract:
 * Purpose: unit tests of `PkijsCmsSignerDriver`: the signature it makes is a detached CMS `SignedData` over the
 *          content that pkijs verifies against the attached certificate, carrying the chain; a missing secret is
 *          refused by its name and never by its value.
 * Boundary: test only; a self-signed certificate and key are generated per run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5); RFC 5652.
 */
import type { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

import { CmsSigner } from "#contracts/ports/cms-signer.port";
import { PkijsCmsSignerDriver } from "#node/pass/pkijs-cms-signer.driver";

/** `der` as a PEM block. */
function pemOf(label: string, der: ArrayBuffer): string {
  return `-----BEGIN ${label}-----\n${btoa(String.fromCharCode(...new Uint8Array(der)))}\n-----END ${label}-----`;
}

/** A self-signed RSA certificate named `name` and its key, as PEM. */
async function identity(name: string): Promise<{ certificate: string; key: string }> {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: Uint8Array.of(1, 0, 1),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const certificate = new pkijs.Certificate();
  certificate.version = 2;
  certificate.serialNumber = new asn1js.Integer({ value: 7 });
  const cn = new pkijs.AttributeTypeAndValue({
    type: "2.5.4.3",
    value: new asn1js.Utf8String({ value: name }),
  });
  certificate.issuer.typesAndValues.push(cn);
  certificate.subject.typesAndValues.push(cn);
  certificate.notBefore.value = new Date("2026-01-01T00:00:00Z");
  certificate.notAfter.value = new Date("2036-01-01T00:00:00Z");
  await certificate.subjectPublicKeyInfo.importKey(pair.publicKey);
  await certificate.sign(pair.privateKey, "SHA-256");
  return {
    certificate: pemOf("CERTIFICATE", certificate.toSchema().toBER(false)),
    key: pemOf("PRIVATE KEY", await crypto.subtle.exportKey("pkcs8", pair.privateKey)),
  };
}

const secretsOf = (values: Record<string, string>): SecretStore =>
  ({ get: (name: string) => values[name] }) as unknown as SecretStore;

describe("PkijsCmsSignerDriver", () => {
  it("makes a detached signature pkijs verifies", async () => {
    const pass = await identity("Pass Type ID: pass.x");
    const wwdr = await identity("WWDR");
    const signer = new PkijsCmsSignerDriver(
      secretsOf({
        APPLE_WALLET_PASS_CERTIFICATE: pass.certificate,
        APPLE_WALLET_PASS_KEY: pass.key,
        APPLE_WALLET_WWDR_CERTIFICATE: wwdr.certificate,
      }),
    );
    expect(signer).toBeInstanceOf(CmsSigner);
    const content = new TextEncoder().encode('{"pass.json":"00"}');
    const der = await signer.sign(content, new Date("2026-10-27T10:00:00Z"));
    const info = pkijs.ContentInfo.fromBER(der.slice().buffer);
    expect(info.contentType).toBe("1.2.840.113549.1.7.2");
    const signed = new pkijs.SignedData({ schema: info.content });
    expect(signed.encapContentInfo.eContent).toBeUndefined();
    expect(signed.certificates).toHaveLength(2);
    expect(
      await signed.verify({ signer: 0, data: content.slice().buffer, checkChain: false }),
    ).toBe(true);
  });

  it("refuses a missing secret by its name", async () => {
    const signer = new PkijsCmsSignerDriver(secretsOf({}));
    await expect(signer.sign(Uint8Array.of(1), new Date(0))).rejects.toThrow(
      /APPLE_WALLET_PASS_CERTIFICATE/,
    );
  });
});
