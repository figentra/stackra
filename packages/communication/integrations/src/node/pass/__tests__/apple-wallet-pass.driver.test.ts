/**
 * Stackra file contract:
 * Purpose: unit tests of `AppleWalletPassDriver`: it is a `WalletPassIssuer`, answers a named `.pkpass` file signed
 *          through the injected `CmsSigner`, and refuses a request without the brand kit's `icon.png`.
 * Boundary: test only; the signer is an in-test driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5).
 */
import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { CmsSigner } from "#contracts/ports/cms-signer.port";
import { AppleWalletPassDriver } from "#node/pass/apple-wallet-pass.driver";
import { WalletPassIssuer } from "#node/pass/wallet-pass-issuer.port";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

class FixedCmsSignerDriver extends Driver(CmsSigner) {
  signed = 0;

  async sign(): Promise<Uint8Array> {
    this.signed += 1;
    return Uint8Array.of(0x30, 0x00);
  }
}

const request: WalletPassRequest = {
  kind: "award",
  locale: "en",
  issuedAt: new Date("2026-10-27T10:00:00Z"),
  images: { "icon.png": Uint8Array.of(1) },
  content: { serial: "awd_1", title: "Reading star", fields: [] },
};

const options = { passTypeIdentifier: "pass.x", teamIdentifier: "T", organizationName: "Acme" };

describe("AppleWalletPassDriver", () => {
  it("issues a signed .pkpass", async () => {
    const signer = new FixedCmsSignerDriver();
    const driver = new AppleWalletPassDriver(signer, options);
    expect(driver).toBeInstanceOf(WalletPassIssuer);
    const pass = await driver.issue(request);
    expect(pass).toMatchObject({
      provider: "apple_wallet",
      serial: "awd_1",
      file: { name: "awd_1.pkpass", mediaType: "application/vnd.apple.pkpass" },
    });
    expect(signer.signed).toBe(1);
  });

  it("refuses a request without icon.png", async () => {
    const driver = new AppleWalletPassDriver(new FixedCmsSignerDriver(), options);
    await expect(driver.issue({ ...request, images: {} })).rejects.toThrow(TypeError);
  });
});
