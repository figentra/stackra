/**
 * Stackra file contract:
 * Purpose: unit tests of `CadesSignerDriver`: a CMS `SignedData` whose signed attributes (content type, message
 *          digest, `ESSCertIDv2`, signing time) verify under the certificate's RSA or EC key, the signer named by the
 *          certificate's issuer and serial, no signing time without `signedAt`, and the refusals.
 * Boundary: test only; deliberately fake units (`__fixtures__/cades-test-units.json`: throwaway keys and self-signed
 *           TEST-ONLY certificates), signed with node:crypto standing in for a token or an e-seal provider. Not a
 *           certification test (stackra-31).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 4).
 */
import { createPrivateKey, sign, verify, X509Certificate } from "node:crypto";
import { readFileSync } from "node:fs";

import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import { FiscalSigningKey } from "#contracts/ports/fiscal-signing-key.port";
import type { SigningCertificate } from "#contracts/types/signing-certificate.type";
import { CadesSignerDriver } from "#core/drivers/cades-signer.driver";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalSignatureUnsupportedError } from "#core/errors/fiscal-signature-unsupported.error";
import { derChildren } from "#core/functions/der-children.function";
import { fromBase64 } from "#core/functions/from-base64.function";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { toHex } from "#core/functions/to-hex.function";
import { FiscalSigningKeyFake } from "#testing/fiscal-signing-key.fake";

/** A throwaway key and its self-signed certificate (base64 DER). */
type TestUnit = { readonly privateKey: string; readonly certificate: string };

/** The fake units: one RSA (ETA's usual seal), one EC P-256. */
const UNITS = JSON.parse(
  readFileSync(new URL("__fixtures__/cades-test-units.json", import.meta.url), "utf8"),
) as { readonly rsa: TestUnit; readonly ec: TestUnit };

/** A key store over one fake unit, signing as a token would: SHA-256 with the unit's key. */
class TestUnitKey extends FiscalSigningKey {
  /** The unit it holds. */
  private readonly unit: TestUnit;

  /**
   * @param unit - the fake unit.
   */
  constructor(unit: TestUnit) {
    super();
    this.unit = unit;
  }

  /** SHA-256 with the unit's key, base64. */
  async sign(_unitId: string, message: Uint8Array): Promise<string> {
    return sign("sha256", message, createPrivateKey(this.unit.privateKey)).toString("base64");
  }

  /** The certificate; the other facts are not read by CAdES. */
  async certificate(): Promise<SigningCertificate> {
    return {
      certificate: this.unit.certificate,
      issuerName: "",
      serialNumber: "",
      publicKey: "",
      certificateSignature: null,
    };
  }
}

/** The canonical document a mandate signs, and its digest. */
const payload = '{"documentType":"I","internalID":"INV-0001"}';
const digest = async () => toBase64(await sha256(payload));

/** `element`'s children, failing the test when it does not parse. */
const children = (element: Uint8Array | undefined): Uint8Array[] => {
  const parsed = element === undefined ? null : derChildren(element);
  expect(parsed).not.toBeNull();
  return parsed ?? [];
};

/** The contents of a primitive element (an OCTET STRING): past its tag and length. */
const contentsOf = (element: Uint8Array | undefined): Uint8Array => {
  const first = element?.[1] ?? 0;
  return (element ?? new Uint8Array()).subarray(first < 0x80 ? 2 : 2 + (first & 0x7f));
};

/** The signer info of a CMS `ContentInfo`: SignedData's last child is the SET of signer infos. */
function signerInfoOf(contentInfo: Uint8Array): Uint8Array[] {
  const [, explicit] = children(contentInfo);
  const [signedData] = children(explicit);
  const [signerInfo] = children(children(signedData).at(-1));
  return children(signerInfo);
}

describe("CadesSignerDriver", () => {
  it.each(["rsa", "ec"] as const)(
    "signs the attributes with a %s key so they verify under its certificate",
    async (kind) => {
      const unit = UNITS[kind];
      const signer = new CadesSignerDriver(new TestUnitKey(unit));
      expect(signer).toBeInstanceOf(FiscalSigner);

      const result = await signer.sign({
        unitId: "pos_1",
        format: SignatureFormat.Cades,
        payload,
        digest: await digest(),
        signedAt: new Date("2026-03-01T09:30:00.000Z"),
      });

      expect([result.signedPayload, result.publicKey, result.certificateSignature]).toEqual([
        null,
        null,
        null,
      ]);
      const [version, signerId, , attributes, , value] = signerInfoOf(fromBase64(result.value));
      expect(toHex(version ?? new Uint8Array())).toBe("020101");
      // the signed bytes are the attributes re-tagged from [0] IMPLICIT to SET
      const signed = Uint8Array.from(attributes ?? [], (byte, at) => (at === 0 ? 0x31 : byte));
      const certificate = new X509Certificate(Buffer.from(unit.certificate, "base64"));
      expect(verify("sha256", signed, certificate.publicKey, contentsOf(value))).toBe(true);

      const text = toHex(attributes ?? new Uint8Array());
      expect(text).toContain(toHex(fromBase64(await digest())));
      expect(text).toContain(toHex(new TextEncoder().encode("260301093000Z")));
      expect(text).toContain(toHex(await sha256(fromBase64(unit.certificate))));
      // named by the certificate's issuer and serial, as it carries them
      const [, serial, , issuer] = children(children(certificate.raw)[0]);
      expect(toHex(signerId ?? new Uint8Array())).toContain(toHex(issuer ?? new Uint8Array()));
      expect(toHex(signerId ?? new Uint8Array())).toContain(toHex(serial ?? new Uint8Array()));
    },
  );

  /** A mandate that gives no sealing time gets none: the signer never reads a clock. */
  it("leaves the signing time out without signedAt", async () => {
    const result = await new CadesSignerDriver(new TestUnitKey(UNITS.rsa)).sign({
      unitId: "pos_1",
      format: SignatureFormat.Cades,
      payload,
      digest: await digest(),
    });
    const [, , , attributes] = signerInfoOf(fromBase64(result.value));
    expect(children(attributes)).toHaveLength(3);
  });

  it("refuses another format, and a unit with no usable certificate", async () => {
    const request = { unitId: "pos_1", payload, digest: await digest() };
    const refusal = async (key: FiscalSigningKey, format: SignatureFormat) => {
      try {
        await new CadesSignerDriver(key).sign({ ...request, format });
        return null;
      } catch (error) {
        return isRefusal(error) ? error : null;
      }
    };

    expect(await refusal(new TestUnitKey(UNITS.rsa), SignatureFormat.Xades)).toBeInstanceOf(
      FiscalSignatureUnsupportedError,
    );
    // the fake's certificate is not DER, and a unit not yet onboarded has none
    expect(await refusal(new FiscalSigningKeyFake(), SignatureFormat.Cades)).toBeInstanceOf(
      FiscalCredentialMissingError,
    );
    expect(await refusal(new FiscalSigningKeyFake(null), SignatureFormat.Cades)).toBeInstanceOf(
      FiscalCredentialMissingError,
    );
  });
});
