/**
 * Stackra file contract:
 * Purpose: unit tests of the `CmsSigner` port: an abstract class that is a `Port`, implemented by a driver that
 *          returns signature bytes for the content and the signing time.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CmsSigner } from "#contracts/ports/cms-signer.port";

class EchoCmsSignerDriver extends Driver(CmsSigner) {
  async sign(content: Uint8Array): Promise<Uint8Array> {
    return content.toReversed();
  }
}

describe("CmsSigner", () => {
  it("is a port a driver implements", async () => {
    const signer = new EchoCmsSignerDriver();
    expect(signer).toBeInstanceOf(CmsSigner);
    expect(signer).toBeInstanceOf(Port);
    expect(await signer.sign(Uint8Array.of(1, 2), new Date(0))).toEqual(Uint8Array.of(2, 1));
  });
});
