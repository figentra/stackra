/**
 * Stackra file contract:
 * Purpose: unit tests of `VerificationService`: providers come from the market pack per kind, in order, only those
 *          wired here and supporting the kind; the first that answers wins; an unavailable provider passes to the
 *          next; none left refuses `verification_unavailable`; a request for another market than the pack's is a bug;
 *          `verifyThrough` tries resolver candidates in order, a platform check never through a tenant's own one.
 * Boundary: test only; memory providers and a one-layer resolved pack.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; Stackra 0357 (decision 7); OS-54; ADR 0370; ADR 0376 (decision 1,
 *                     verification Note); capability map M2.
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { MarketPack, ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import {
  Verification,
  VerificationKind,
  VerificationStatus,
  VerificationUse,
} from "#contracts/index";
import type { VerificationRequest } from "#contracts/index";
import { MemoryVerificationDriver } from "#core/drivers/memory-verification.driver";
import { VerificationUnavailableError } from "#core/errors/verification-unavailable.error";
import { VerificationService } from "#core/services/verification.service";

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
}

/** A provider that is always down. */
class DownVerificationDriver extends Driver(Verification) {
  supports(): boolean {
    return true;
  }

  async verify(): Promise<never> {
    throw VerificationUnavailableError.create();
  }
}

/** A one-layer pack of market `xx` listing `drivers`. */
const pack = (drivers: unknown): ResolvedPack => ({
  market: "xx",
  layers: [
    {
      market: "xx",
      version: "1.0.0",
      entries: [{ key: "verification.drivers", value: drivers, from: "2026-01-01" }],
    } as unknown as MarketPack,
  ],
});

const request: VerificationRequest = {
  kind: VerificationKind.Company,
  market: "xx",
  reference: "chk_1",
  subject: { registrationNumber: "1010010000" },
  consented: true,
};

describe("VerificationService", () => {
  it("runs the check at the first wired provider the pack lists", async () => {
    const clock = new FixedClockDriver();
    const registry = new MemoryVerificationDriver(clock).seed([VerificationKind.Company]);
    const document = new MemoryVerificationDriver(clock).seed([VerificationKind.Identity]);
    registry.answer("chk_1", VerificationStatus.Verified);
    const service = new VerificationService(buildConfig(IdentityConfig));
    service.register("down", new DownVerificationDriver());
    service.register("registry", registry);
    service.register("document", document);
    const resolved = pack({ company: ["unwired", "document", "down", "registry"] });
    expect(service.providersFor(request, resolved, "2026-10-25")).toEqual(["down", "registry"]);
    expect(await service.verify(request, resolved, "2026-10-25")).toEqual({
      status: VerificationStatus.Verified,
      provider: "registry",
      providerReference: "memory:chk_1",
      checkedAt: new Date("2026-10-25T09:00:00Z"),
      reasons: [],
    });
  });

  it("refuses when no listed provider answers, and a request for another market", async () => {
    const service = new VerificationService(buildConfig(IdentityConfig));
    service.register("down", new DownVerificationDriver());
    await expect(
      service.verify(request, pack({ company: ["down"] }), "2026-10-25"),
    ).rejects.toBeInstanceOf(VerificationUnavailableError);
    await expect(service.verify(request, pack("nope"), "2026-10-25")).rejects.toBeInstanceOf(
      VerificationUnavailableError,
    );
    await expect(
      service.verify({ ...request, market: "yy" }, pack({ company: ["down"] }), "2026-10-25"),
    ).rejects.toThrow(RangeError);
  });

  it("verifies through resolver candidates, a platform check only through managed ones", async () => {
    const clock = new FixedClockDriver();
    const scopeOwn = new MemoryVerificationDriver(clock).seed([VerificationKind.Company]);
    const platform = new MemoryVerificationDriver(clock).seed([VerificationKind.Company]);
    const identityOnly = new MemoryVerificationDriver(clock).seed([VerificationKind.Identity]);
    platform.answer("chk_1", VerificationStatus.Verified);
    const candidates = [
      { provider: "sumsub", connection: scopeOwn, mode: "own" as const },
      { provider: "didit", connection: identityOnly, mode: "managed" as const },
      { provider: "down", connection: new DownVerificationDriver(), mode: "managed" as const },
      { provider: "wathq", connection: platform, mode: "managed" as const },
    ];
    const service = new VerificationService(buildConfig(IdentityConfig));
    expect(await service.verifyThrough(request, candidates)).toMatchObject({
      status: VerificationStatus.Verified,
      provider: "wathq",
      mode: "managed",
    });
    expect(scopeOwn.seen).toEqual([]);
    expect(identityOnly.seen).toEqual([]);
    expect(
      await service.verifyThrough({ ...request, use: VerificationUse.Scope }, candidates),
    ).toMatchObject({ provider: "sumsub", mode: "own", status: VerificationStatus.Pending });
    await expect(service.verifyThrough(request, candidates.slice(0, 1))).rejects.toBeInstanceOf(
      VerificationUnavailableError,
    );
  });
});
