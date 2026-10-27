/**
 * Stackra file contract:
 * Purpose: `ExitGateService`, the exit check of a self-checkout lane or a store exit: each credential the
 *          `AccessController` reads is taken as a signed receipt token; the gate opens once for a token whose Ed25519
 *          signature the configured public key accepts, issued in this node within `exitTokenMaxAge`, admitted by the
 *          product's rule, and claimed first in the `UsedReceiptStore` (this gate's memory, or the venue's shared
 *          store so a receipt opens one of several exits once); every decision is reported.
 * Boundary: decides and opens only; signing is the till's (`signReceiptToken`). The key and the age are
 *           `PeripheralsConfig` values (configuration), the node and the rule are the caller's data. Every refusal is
 *           reported, never thrown, so one bad scan never stops the gate. A store that cannot answer keeps the gate
 *           closed (`store`); a claimed receipt whose gate then fails to open is given back.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decisions 1 to 3); ADR 0449 (decision 4); config-model (gate rules are rule sets).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Duration } from "@stackra/contracts";

import type { PeripheralsConfig } from "#config/peripherals.config";
import type { AccessController } from "#contracts/ports/access-controller.port";
import type { UsedReceiptStore } from "#contracts/ports/used-receipt-store.port";
import type { ExitDecision } from "#contracts/types/exit-decision.type";
import { importReceiptPublicKey } from "#core/functions/import-receipt-public-key.function";
import { verifyReceiptToken } from "#core/functions/verify-receipt-token.function";
import type { ExitGateOptions } from "#core/types/exit-gate-options.type";

/**
 * The exit gate.
 *
 * @example
 * const stop = await exitGate.start({ nodeId: device.nodeId, admit: (claims) => rules.allows("exit", claims) });
 */
export class ExitGateService extends Service {
  /** The gate. */
  private readonly gate: AccessController;

  /** The key and the age. */
  private readonly config: PeripheralsConfig;

  /** The current time. */
  private readonly clock: Clock;

  /** The receipts that have opened this gate or, with a shared store, any exit of the venue. */
  private readonly used: UsedReceiptStore;

  /**
   * @param gate - the gate and its reader.
   * @param config - the peripherals configuration (`exitTokenPublicKey`, `exitTokenMaxAge`).
   * @param clock - the current time.
   * @param used - the used receipts (`peripherals.usedReceiptStore`).
   */
  constructor(
    gate: AccessController,
    config: PeripheralsConfig,
    clock: Clock,
    used: UsedReceiptStore,
  ) {
    super();
    this.gate = gate;
    this.config = config;
    this.clock = clock;
    this.used = used;
  }

  /**
   * Starts checking credentials; the returned function stops it.
   *
   * @throws RangeError when `exitTokenPublicKey` is not set or is not a key.
   */
  async start(options: ExitGateOptions): Promise<() => void> {
    const key = await importReceiptPublicKey(this.config.exitTokenPublicKey);
    let queue = Promise.resolve();
    // One credential at a time, so two scans of one receipt cannot both pass the reuse check.
    return this.gate.onCredential((credential) => {
      queue = queue.then(async () => {
        const decision = await this.check(credential, key, options);
        try {
          options.onDecision?.(decision);
        } catch {
          // A failing listener never stops the gate; the next credential is still checked.
        }
      });
    });
  }

  /** Decides one credential and opens the gate when it passes. */
  private async check(
    credential: string,
    key: CryptoKey,
    options: ExitGateOptions,
  ): Promise<ExitDecision> {
    const verified = await verifyReceiptToken(credential, key);
    if (!verified.ok) return { opened: false, reason: verified.reason };
    const { claims } = verified;
    const maxAge = Duration.toMilliseconds(this.config.exitTokenMaxAge);
    const age = this.clock.now().getTime() - claims.issuedAt;
    if (age < 0 || age > maxAge) return { opened: false, reason: "expired", claims };
    if (claims.nodeId !== options.nodeId) return { opened: false, reason: "node", claims };
    if (options.admit !== undefined) {
      // A rule that fails to answer keeps the gate closed, as a refusal does.
      const isAdmitted = await Promise.resolve()
        .then(() => options.admit?.(claims))
        .catch(() => false);
      if (isAdmitted !== true) return { opened: false, reason: "rule", claims };
    }
    // Claimed after the rule, so a refused receipt is not spent; the claim is atomic across a venue's exits.
    const claimed = await this.used.claim(claims.receiptId, new Date(claims.issuedAt + maxAge));
    if (!claimed.ok) return { opened: false, reason: "store", claims };
    if (!claimed.data) return { opened: false, reason: "used", claims };
    const opened = await this.gate.open();
    if (opened.ok) return { opened: true, claims };
    await this.used.release(claims.receiptId);
    return { opened: false, reason: "gate", claims };
  }
}
