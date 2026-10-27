/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: exactly the wallet pass port, drivers, builders and the
 *          signer's secret names, and the SIP trunk gateway, its RTP device driver and secret names are exported.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0348 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/integrations/node", () => {
  it("exports exactly the wallet pass and SIP trunk surface", () => {
    expect(Object.keys(node).sort()).toEqual([
      "APPLE_WALLET_SIGNER_SECRETS",
      "AppleWalletPassDriver",
      "GoogleWalletPassDriver",
      "PkijsCmsSignerDriver",
      "RtpAudioDeviceDriver",
      "SIP_TRUNK_SECRETS",
      "SipVoiceGateway",
      "WalletPassIssuer",
      "applePassJson",
      "buildPkpass",
      "googleWalletObject",
    ]);
  });
});
