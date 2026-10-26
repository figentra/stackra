/**
 * Stackra file contract:
 * Purpose: proves `ExitGateService` opens the gate once for a fresh receipt token of its node that the rule admits,
 *          and refuses (without opening) a reused, expired, foreign-node, rule-refused, unsigned or malformed token,
 *          reporting each decision; and that it will not start without a public key.
 * Boundary: test only; the memory gate, a fixed clock and real Ed25519 keys made in the test.
 * Runtime: node
 * Governing contract: ADR 0429 (decisions 1 and 2); ADR 0022 (test placement).
 */
import { buildConfig } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PeripheralsConfig } from "#config/peripherals.config";
import type { ExitDecision } from "#contracts/types/exit-decision.type";
import { MemoryAccessControllerDriver } from "#core/drivers/memory-access-controller.driver";
import { base64Url } from "#core/functions/base64-url.function";
import { signReceiptToken } from "#core/functions/sign-receipt-token.function";
import { ExitGateService } from "#core/services/exit-gate.service";

const NOW = new Date("2026-10-26T10:00:00Z");

/** A clock stopped at `NOW`. */
class FixedClock extends Clock {
  now(): Date {
    return new Date(NOW);
  }
}

/** A gate with a fresh key, started for node `nod_1`, and a signer for its tokens. */
async function startGate(admit?: (claims: { receiptId: string }) => boolean) {
  const keys = (await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
  const config = buildConfig(PeripheralsConfig, { values: { exitTokenPublicKey: base64Url(raw) } });
  const gate = new MemoryAccessControllerDriver();
  const decisions: ExitDecision[] = [];
  const service = new ExitGateService(gate, config, new FixedClock());
  await service.start({
    nodeId: "nod_1",
    admit,
    onDecision: (decision) => decisions.push(decision),
  });
  const token = (receiptId: string, overrides: { nodeId?: string; issuedAt?: number } = {}) =>
    signReceiptToken(
      {
        receiptId,
        nodeId: overrides.nodeId ?? "nod_1",
        issuedAt: overrides.issuedAt ?? NOW.getTime() - 60_000,
      },
      keys.privateKey,
    );
  /** Presents `credential` and waits for its decision. */
  const present = async (credential: string): Promise<ExitDecision | undefined> => {
    const before = decisions.length;
    gate.present(credential);
    await vi.waitFor(() => expect(decisions.length).toBe(before + 1));
    return decisions.at(-1);
  };
  return { gate, token, present };
}

describe("ExitGateService", () => {
  it("opens once for a fresh token of its node, and refuses it the second time", async () => {
    const { gate, token, present } = await startGate();
    const credential = await token("rct_1");
    expect(await present(credential)).toMatchObject({
      opened: true,
      claims: { receiptId: "rct_1" },
    });
    expect(await present(credential)).toMatchObject({ opened: false, reason: "used" });
    expect(gate.opened).toBe(1);
  });

  it("refuses an expired, foreign-node, rule-refused, unsigned or malformed token", async () => {
    const { gate, token, present } = await startGate(
      (claims) => claims.receiptId !== "rct_blocked",
    );
    expect(
      await present(await token("rct_2", { issuedAt: NOW.getTime() - 31 * 60_000 })),
    ).toMatchObject({
      reason: "expired",
    });
    expect(await present(await token("rct_3", { nodeId: "nod_2" }))).toMatchObject({
      reason: "node",
    });
    expect(await present(await token("rct_blocked"))).toMatchObject({ reason: "rule" });
    const [body] = (await token("rct_4")).split(".");
    expect(await present(`${body}.AAAA`)).toMatchObject({ reason: "signature" });
    expect(await present("hello")).toMatchObject({ reason: "malformed" });
    expect(gate.opened).toBe(0);
  });

  it("will not start without a public key", async () => {
    const service = new ExitGateService(
      new MemoryAccessControllerDriver(),
      buildConfig(PeripheralsConfig),
      new FixedClock(),
    );
    await expect(service.start({ nodeId: "nod_1" })).rejects.toThrow(RangeError);
  });
});
