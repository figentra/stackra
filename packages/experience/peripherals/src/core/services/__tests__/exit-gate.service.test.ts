/**
 * Stackra file contract:
 * Purpose: proves `ExitGateService` opens the gate once for a fresh receipt token of its node that the rule admits,
 *          and refuses (without opening) a reused, expired, foreign-node, rule-refused, unsigned or malformed token,
 *          reporting each decision; that two gates sharing one used-receipt store let a receipt out once; that a store
 *          that cannot answer keeps the gate closed; that a receipt is given back when the gate fails to open; and
 *          that it will not start without a public key.
 * Boundary: test only; the memory gate and used-receipt store, a fixed clock and real Ed25519 keys made in the test.
 * Runtime: node
 * Governing contract: ADR 0429 (decisions 1 to 3); ADR 0449 (decision 4); ADR 0022 (test placement).
 */
import { buildConfig } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PeripheralsConfig } from "#config/peripherals.config";
import type { ExitDecision } from "#contracts/types/exit-decision.type";
import { MemoryAccessControllerDriver } from "#core/drivers/memory-access-controller.driver";
import { MemoryUsedReceiptStoreDriver } from "#core/drivers/memory-used-receipt-store.driver";
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

/** A gate with a fresh key (or `shared`'s), started for node `nod_1`, and a signer for its tokens. */
async function startGate(
  admit?: (claims: { receiptId: string }) => boolean,
  shared?: { keys: CryptoKeyPair; used: MemoryUsedReceiptStoreDriver },
) {
  const keys =
    shared?.keys ??
    ((await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"])) as CryptoKeyPair);
  const used = shared?.used ?? new MemoryUsedReceiptStoreDriver();
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
  const config = buildConfig(PeripheralsConfig, { values: { exitTokenPublicKey: base64Url(raw) } });
  const gate = new MemoryAccessControllerDriver();
  const decisions: ExitDecision[] = [];
  const service = new ExitGateService(gate, config, new FixedClock(), used);
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
  return { gate, token, present, keys, used };
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

  it("lets a receipt out of one exit of a venue whose exits share a store", async () => {
    const first = await startGate();
    const second = await startGate(undefined, { keys: first.keys, used: first.used });
    const credential = await first.token("rct_5");
    expect(await first.present(credential)).toMatchObject({ opened: true });
    expect(await second.present(credential)).toMatchObject({ opened: false, reason: "used" });
    expect(second.gate.opened).toBe(0);
  });

  it("stays closed when the store cannot answer, and gives the receipt back when the gate fails", async () => {
    const { gate, token, present, used } = await startGate();
    used.isPresent = false;
    expect(await present(await token("rct_6"))).toMatchObject({ opened: false, reason: "store" });
    used.isPresent = true;
    vi.spyOn(gate, "open").mockResolvedValueOnce({
      ok: false,
      error: { code: "unavailable", capability: "access_controller" },
    });
    const credential = await token("rct_7");
    expect(await present(credential)).toMatchObject({ opened: false, reason: "gate" });
    expect(await present(credential)).toMatchObject({ opened: true });
  });

  it("will not start without a public key", async () => {
    const service = new ExitGateService(
      new MemoryAccessControllerDriver(),
      buildConfig(PeripheralsConfig),
      new FixedClock(),
      new MemoryUsedReceiptStoreDriver(),
    );
    await expect(service.start({ nodeId: "nod_1" })).rejects.toThrow(RangeError);
  });
});
