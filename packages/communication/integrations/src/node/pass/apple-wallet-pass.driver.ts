/**
 * Stackra file contract:
 * Purpose: `AppleWalletPassDriver`, the Apple Wallet `WalletPassIssuer`: `pass.json` from the request
 *          (`applePassJson`), the brand-kit images, then the signed `.pkpass` bundle (`buildPkpass`) through the host's
 *          `CmsSigner`.
 * Boundary: no network; the bundle is returned, the host serves or sends it. The host constructs it with its signer
 *           and the deployment's `AppleWalletOptions`. Not yet certified on a device against a registered pass type
 *           (STA-791 acceptance: a signed .pkpass opens on iOS).
 * Runtime: node
 * Governing contract: ADR 0348 (decision 5); ADR 0294 (decision 25: drivers extend `Driver(Port)`).
 */
import { Driver } from "@stackra/container";

import type { CmsSigner } from "#contracts/ports/cms-signer.port";
import { applePassJson } from "#node/pass/apple-pass-json.function";
import type { AppleWalletOptions } from "#node/pass/apple-wallet-options.type";
import { buildPkpass } from "#node/pass/build-pkpass.function";
import type { IssuedWalletPass } from "#node/pass/issued-wallet-pass.type";
import { WalletPassIssuer } from "#node/pass/wallet-pass-issuer.port";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

/**
 * Issues signed Apple Wallet passes.
 *
 * @example
 * const apple = new AppleWalletPassDriver(new PkijsCmsSignerDriver(secrets), options);
 * const { file } = await apple.issue(request);
 */
export class AppleWalletPassDriver extends Driver(WalletPassIssuer) {
  private readonly signer: CmsSigner;

  private readonly options: AppleWalletOptions;

  constructor(signer: CmsSigner, options: AppleWalletOptions) {
    super();
    this.signer = signer;
    this.options = options;
  }

  /**
   * The signed `.pkpass`.
   *
   * @throws TypeError when the request has no `icon.png` image, which Apple Wallet requires.
   */
  async issue(request: WalletPassRequest): Promise<IssuedWalletPass> {
    const images = request.images ?? {};
    if (images["icon.png"] === undefined)
      throw new TypeError("an Apple Wallet pass needs the brand kit's icon.png");
    const json = new TextEncoder().encode(JSON.stringify(applePassJson(request, this.options)));
    const bytes = await buildPkpass(
      { ...images, "pass.json": json },
      this.signer,
      request.issuedAt,
    );
    return {
      provider: "apple_wallet",
      serial: request.content.serial,
      file: {
        name: `${request.content.serial}.pkpass`,
        mediaType: "application/vnd.apple.pkpass",
        bytes,
      },
    };
  }
}
