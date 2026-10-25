/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryESignatureDriver`: send, idempotent per reference, status, settle, download only when
 *          signed, cancel only while open, and refusals for an unknown id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { SignatureStatus } from "#contracts/enums/signature-status.enum";
import { MemoryESignatureDriver } from "#core/drivers/memory-e-signature.driver";
import { SignatureEnvelopeClosedError } from "#core/errors/signature-envelope-closed.error";
import { SignatureEnvelopeNotFoundError } from "#core/errors/signature-envelope-not-found.error";
import { SignatureNotCompleteError } from "#core/errors/signature-not-complete.error";

const request = (reference: string) => ({
  reference,
  title: "Consent",
  document: new Uint8Array([7]),
  contentHash: "sha256:00",
  signers: [{ name: "Signer", phone: "+10000000000", order: 1 }],
  locale: "en",
});

describe("MemoryESignatureDriver", () => {
  it("opens one envelope per reference", async () => {
    const provider = new MemoryESignatureDriver();
    const first = await provider.send(request("a"));
    expect(first).toEqual({ id: "env_1", reference: "a", status: SignatureStatus.Sent });
    expect(await provider.send(request("a"))).toEqual(first);
    expect((await provider.send(request("b"))).id).toBe("env_2");
  });

  it("downloads the document only once signed", async () => {
    const provider = new MemoryESignatureDriver();
    const { id } = await provider.send(request("a"));
    await expect(provider.download(id)).rejects.toThrow(SignatureNotCompleteError);
    provider.settle(id, SignatureStatus.Viewed);
    expect((await provider.status(id)).closedAt).toBeUndefined();
    const signed = provider.settle(id, SignatureStatus.Signed);
    expect(signed.closedAt).toBeTypeOf("string");
    expect(await provider.download(id)).toEqual(new Uint8Array([7]));
  });

  it("cancels only an open envelope", async () => {
    const provider = new MemoryESignatureDriver();
    const { id } = await provider.send(request("a"));
    expect((await provider.cancel(id)).status).toBe(SignatureStatus.Cancelled);
    await expect(provider.cancel(id)).rejects.toThrow(SignatureEnvelopeClosedError);
    expect(() => provider.settle(id, SignatureStatus.Signed)).toThrow(SignatureEnvelopeClosedError);
  });

  it("refuses an unknown envelope", async () => {
    const provider = new MemoryESignatureDriver();
    await expect(provider.status("env_9")).rejects.toThrow(SignatureEnvelopeNotFoundError);
  });
});
