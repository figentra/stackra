/**
 * Stackra file contract:
 * Purpose: unit tests of `MarketPackPaymentPackSourceDriver`: a Market's pack resolves from the deployment's packs
 *          (read through the real `valueOf`), a Market with none refuses with `PackNotFoundError`, and a platform
 *          Connection comes from `PaymentsConfig` (none for a provider or Market it does not name).
 * Boundary: test only; the packs come from the memory `ResolvedPackSource` with a made-up Market `xa`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0370; ADR 0418; STA-1705.
 */
import { buildConfig } from "@stackra/config";
import {
  type MarketPack,
  MemoryResolvedPackSourceDriver,
  PackNotFoundError,
  PackStatus,
  valueOf,
} from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { PaymentsConfig } from "#config/payments.config";
import { PaymentPackSource } from "#contracts/ports/payment-pack-source.port";
import { MarketPackPaymentPackSourceDriver } from "#node/drivers/market-pack-payment-pack-source.driver";

const PACK: MarketPack = {
  market: "xa",
  version: "1.0.0",
  status: PackStatus.Live,
  entries: [{ key: "payments.byo-providers", value: ["stripe"], from: "2000-01-01" }],
  reviews: [],
  checklist: [],
};

/** The platform runs `stripe` in `xa` only. */
class HostPaymentsConfig extends PaymentsConfig {
  override platformConnections = { xa: { stripe: "conn_platform_stripe" } };
}

/** The driver over the `xa` pack and the host's configuration. */
function source(): MarketPackPaymentPackSourceDriver {
  return new MarketPackPaymentPackSourceDriver(
    new MemoryResolvedPackSourceDriver().use([PACK]),
    buildConfig(HostPaymentsConfig),
  );
}

describe("MarketPackPaymentPackSourceDriver", () => {
  it("resolves the Market's pack from the deployment's packs", async () => {
    expect(source()).toBeInstanceOf(PaymentPackSource);
    const resolved = await source().resolve("xa");
    expect(valueOf(resolved, "payments.byo-providers", "2026-10-31")?.value).toEqual(["stripe"]);
  });

  it("refuses a Market with no pack", async () => {
    await expect(source().resolve("xb")).rejects.toBeInstanceOf(PackNotFoundError);
  });

  it("names the configured platform Connection, and none for anything else", async () => {
    await expect(source().platformConnection("xa", "stripe")).resolves.toBe("conn_platform_stripe");
    await expect(source().platformConnection("xa", "adyen")).resolves.toBeUndefined();
    await expect(source().platformConnection("xb", "stripe")).resolves.toBeUndefined();
  });
});
