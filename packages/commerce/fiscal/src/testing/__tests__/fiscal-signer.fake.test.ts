/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalSignerFake`: a stable signature per unit and payload, the payload back for XAdES only,
 *          and fixed public material.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import { FiscalSignerFake } from "#testing/fiscal-signer.fake";

describe("FiscalSignerFake", () => {
  it("signs deterministically and envelopes only XAdES", async () => {
    const signer = new FiscalSignerFake();
    const request = { unitId: "u", format: SignatureFormat.Xades, payload: "<x></x>", digest: "d" };
    const first = await signer.sign(request);
    expect(signer).toBeInstanceOf(FiscalSigner);
    expect(await signer.sign(request)).toEqual(first);
    expect(first.signedPayload).toBe("<x></x>");
    expect(
      (await signer.sign({ ...request, format: SignatureFormat.Raw })).signedPayload,
    ).toBeNull();
    expect((await signer.sign({ ...request, unitId: "v" })).value).not.toBe(first.value);
    expect(signer.calls("sign")).toHaveLength(4);
  });
});
