/**
 * Stackra file contract:
 * Purpose: the `WalletPassIssuer` port: issue one wallet pass from a pass kind's content, answered as the provider's
 *          artefact (`IssuedWalletPass`). Drivers: `AppleWalletPassDriver` and `GoogleWalletPassDriver`.
 * Boundary: an abstract class that is its own token. It lives in `./node` beside its drivers, because its request
 *           uses `PassContent` of `.` and passes are issued on the server (ADR 0348 decision 5). Updates pushed to
 *           devices and revocation are not part of it yet (STA-791).
 * Runtime: node
 * Governing contract: ADR 0348 (decision 5).
 */
import { Port } from "@stackra/contracts";

import type { IssuedWalletPass } from "#node/pass/issued-wallet-pass.type";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

/**
 * Issues wallet passes for one provider.
 *
 * @example
 * const pass = await this.apple.issue({ kind: "loyalty_card", content, labels, locale: "en", issuedAt: ctx.now() });
 */
export abstract class WalletPassIssuer extends Port {
  /** The issued pass. */
  abstract issue(request: WalletPassRequest): Promise<IssuedWalletPass>;
}
