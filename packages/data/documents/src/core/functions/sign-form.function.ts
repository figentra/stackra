/**
 * Stackra file contract:
 * Purpose: `signForm`, a form signed on a device (an intake or consent form, a delivery receipt) as a PDF: the drawn
 *          signature placed in the template's signature block, the PDF's content hash, the signature's own hash, the
 *          signer and the time.
 * Boundary: the signer goes into the render data under the reserved key `signer` (`signer.name`, `signer.signedAt`
 *           as ISO 8601, `signer.image`); data that already has `signer` throws `DocumentValueError` (`reserved`), and
 *           a template with no signature block bound to `signer.image` throws `InvalidDocumentTemplateError`. This is
 *           a simple electronic signature; an advanced or qualified one goes through `ESignatureProvider`. Storing and
 *           auditing the result is the caller's (OS files).
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 4).
 */
import type { PdfEngine } from "#contracts/ports/pdf-engine.port";
import { DocumentFormat } from "#core/enums/document-format.enum";
import { DocumentValueError } from "#core/errors/document-value.error";
import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
import { contentHashOf } from "#core/functions/content-hash-of.function";
import { parseDocumentTemplate } from "#core/functions/parse-document-template.function";
import { renderDocument } from "#core/functions/render-document.function";
import type { DocumentTemplate } from "#core/types/document-template.type";
import type { SignedForm } from "#core/types/signed-form.type";
import type { SignerInput } from "#core/types/signer-input.type";

/**
 * The signed PDF of `template` for `signer`.
 *
 * @throws InvalidDocumentTemplateError when the template has no signature block bound to `signer.image`.
 * @throws DocumentValueError when `data` sets `signer` or lacks a value the template needs.
 *
 * @example
 * const form = await signForm({ template: consent, data: { client, venue }, signer, pdfEngine });
 */
export async function signForm(options: {
  readonly template: DocumentTemplate;
  readonly data: Readonly<Record<string, unknown>>;
  readonly signer: SignerInput;
  readonly pdfEngine: PdfEngine;
}): Promise<SignedForm> {
  if (Object.hasOwn(options.data, "signer"))
    throw DocumentValueError.create({ path: "signer", reason: "reserved" });
  const template = parseDocumentTemplate(options.template);
  if (
    !template.blocks.some((block) => block.type === "signature" && block.image === "signer.image")
  )
    throw InvalidDocumentTemplateError.create({
      path: "blocks",
      problem: "a signed form needs a signature block bound to signer.image",
    });
  const signedAt = options.signer.signedAt.toISOString();
  const pdf = await renderDocument({
    template,
    data: {
      ...options.data,
      signer: { name: options.signer.name, signedAt, image: options.signer.image },
    },
    format: DocumentFormat.Pdf,
    pdfEngine: options.pdfEngine,
  });
  return {
    pdf,
    signatureHash: await contentHashOf(options.signer.image.bytes),
    signerName: options.signer.name,
    signedAt,
  };
}
