/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `ESignatureProvider` port: an abstract class that extends `Port`, keyed
 *          `documents.ESignatureProvider`, that makes a driver implement `send`, `status`, `download` and `cancel`,
 *          and whose `send` is idempotent on the reference (through the package's memory driver).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365 (decision 5).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ESignatureProvider } from "#contracts/ports/e-signature-provider.port";
import type { SignatureEnvelope } from "#contracts/types/signature-envelope.type";
import { MemoryESignatureDriver } from "#core/drivers/memory-e-signature.driver";

const REQUEST = {
  reference: "frm_1",
  title: "Consent",
  document: new Uint8Array([1, 2, 3]),
  contentHash: "sha256:00",
  signers: [{ name: "Signer", email: "signer@example.test", order: 1 }],
  locale: "en",
};

describe("ESignatureProvider", () => {
  it("is an abstract port keyed documents.ESignatureProvider", () => {
    const provider: ESignatureProvider = new MemoryESignatureDriver();
    expect(provider).toBeInstanceOf(Port);
    expect(provider).toBeInstanceOf(ESignatureProvider);
    expectTypeOf<ESignatureProvider["~key"]>().toEqualTypeOf<"documents.ESignatureProvider">();
    expectTypeOf<ESignatureProvider["send"]>().returns.toEqualTypeOf<Promise<SignatureEnvelope>>();
    expectTypeOf<ESignatureProvider["download"]>().returns.toEqualTypeOf<Promise<Uint8Array>>();
  });

  it("makes a driver implement send, status, download and cancel", () => {
    // @ts-expect-error -- the four methods are abstract and not implemented
    class EmptyDriver extends Driver(ESignatureProvider) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("answers one envelope per reference", async () => {
    const provider: ESignatureProvider = new MemoryESignatureDriver();
    const first = await provider.send(REQUEST);
    expect(await provider.send(REQUEST)).toEqual(first);
  });
});
