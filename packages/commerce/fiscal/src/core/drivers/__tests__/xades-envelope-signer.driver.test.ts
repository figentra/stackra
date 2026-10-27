/**
 * Stackra file contract:
 * Purpose: unit tests of `XadesEnvelopeSignerDriver`: the UBL extensions first in the root and the signature marker
 *          before the supplier party, the invoice digest and the signed-properties digest in the signed info, the key
 *          asked to sign the invoice hash, the certificate facts passed through, and the refusals.
 * Boundary: test only; the key is a fake, so the signature is not cryptographically valid. Not a certification test
 *           (stackra-31).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import { XadesEnvelopeSignerDriver } from "#core/drivers/xades-envelope-signer.driver";
import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";
import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";
import { FiscalSignatureUnsupportedError } from "#core/errors/fiscal-signature-unsupported.error";
import { fromBase64 } from "#core/functions/from-base64.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { FiscalSigningKeyFake } from "#testing/fiscal-signing-key.fake";

const payload =
  '<Invoice xmlns="urn:x"><cbc:ID>1</cbc:ID><cac:AccountingSupplierParty></cac:AccountingSupplierParty></Invoice>';
const digest = toBase64("invoice-hash");
const request = {
  unitId: "till_1",
  format: SignatureFormat.Xades,
  payload,
  digest,
  signedAt: new Date("2026-03-01T09:30:00.000Z"),
};

describe("XadesEnvelopeSignerDriver", () => {
  it("envelopes the invoice and signs its hash with the unit's key", async () => {
    const key = new FiscalSigningKeyFake();
    const signer = new XadesEnvelopeSignerDriver(key);
    expect(signer).toBeInstanceOf(FiscalSigner);
    const result = await signer.sign(request);
    const signed = result.signedPayload ?? "";
    expect(signed.startsWith('<Invoice xmlns="urn:x"><ext:UBLExtensions>')).toBe(true);
    expect(signed).toContain(
      "</ext:UBLExtensions><cbc:ID>1</cbc:ID><cac:Signature><cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>",
    );
    expect(signed.indexOf("<cac:Signature>")).toBeLessThan(
      signed.indexOf("<cac:AccountingSupplierParty>"),
    );
    expect(signed).toContain(`<ds:DigestValue>${digest}</ds:DigestValue>`);
    expect(signed).toContain("<xades:SigningTime>2026-03-01T09:30:00</xades:SigningTime>");
    expect(signed).toContain(`<ds:SignatureValue>${result.value}</ds:SignatureValue>`);
    expect(signed).toContain("<ds:X509SerialNumber>1234567890</ds:X509SerialNumber>");
    const [call] = key.calls("sign") as { unitId: string; message: Uint8Array }[];
    expect(call?.message).toEqual(fromBase64(digest));
    expect([result.publicKey, result.certificateSignature]).toEqual([
      toBase64("public-key"),
      toBase64("certificate-signature"),
    ]);
  });

  it("puts the marker before the root's end when there is no supplier party", async () => {
    const result = await new XadesEnvelopeSignerDriver(new FiscalSigningKeyFake()).sign({
      ...request,
      payload: "<Invoice><cbc:ID>1</cbc:ID></Invoice>",
    });
    expect(result.signedPayload?.endsWith("</cac:Signature></Invoice>")).toBe(true);
  });

  it("refuses another format, a request without a time and a unit without a certificate", async () => {
    const signer = new XadesEnvelopeSignerDriver(new FiscalSigningKeyFake());
    await expect(signer.sign({ ...request, format: SignatureFormat.Cades })).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, FiscalSignatureUnsupportedError),
    );
    const { signedAt: _left, ...untimed } = request;
    await expect(signer.sign(untimed)).rejects.toSatisfy((error: unknown) =>
      isRefusal(error, FiscalDocumentInvalidError),
    );
    await expect(
      new XadesEnvelopeSignerDriver(new FiscalSigningKeyFake(null)).sign(request),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, FiscalCredentialMissingError));
  });
});
