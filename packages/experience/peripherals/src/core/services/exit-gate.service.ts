/**
 * Stackra file contract:
 * Purpose: `ExitGateService`, the exit check of a self-checkout lane or a store exit: each credential the
 *          `AccessController` reads is taken as a signed receipt token; the gate opens once for a token whose Ed25519
 *          signature the configured public key accepts, issued in this node within `exitTokenMaxAge`, not used before
 *          at this gate, and admitted by the product's rule; every decision is reported.
 * Boundary: decides and opens only; signing is the till's (`signReceiptToken`). The key and the age are
 *           `PeripheralsConfig` values (configuration), the node and the rule are the caller's data. Every refusal is
 *           reported, never thrown, so one bad scan never stops the gate.
 * Runtime: isomorphic
 * Governing contract: ADR 0429 (decisions 1 and 2); config-model (gate rules are rule sets).
 */
import { Service } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";

import { PeripheralsConfig } from "#config/peripherals.config";
import { AccessController } from "#contracts/ports/access-controller.port";
import type { ExitDecision } from "#contracts/types/exit-decision.type";
import { importReceiptPublicKey } from "#core/functions/import-receipt-public-key.function";
import { verifyReceiptToken } from "#core/functions/verify-receipt-token.function";
import type { ExitGateOptions } from "#core/types/exit-gate-options.type";

/** How many used receipts a gate remembers; the oldest is forgotten first. */
// shortcut: one gate's memory, bounded; a venue with several exits shares a used-receipt store when one ships (ADR 0429).
const REMEMBERED = 10_000;

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

  /** The receipts that have opened this gate, oldest first. */
  private readonly used = new Set<string>();

  /**
   * @param gate - the gate and its reader.
   * @param config - the peripherals configuration (`exitTokenPublicKey`, `exitTokenMaxAge`).
   * @param clock - the current time.
   */
  constructor(gate: AccessController, config: PeripheralsConfig, clock: Clock) {
    super();
    this.gate = gate;
    this.config = config;
    this.clock = clock;
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
    const age = this.clock.now().getTime() - claims.issuedAt;
    if (age < 0 || age > Duration.toMilliseconds(this.config.exitTokenMaxAge))
      return { opened: false, reason: "expired", claims };
    if (claims.nodeId !== options.nodeId) return { opened: false, reason: "node", claims };
    if (this.used.has(claims.receiptId)) return { opened: false, reason: "used", claims };
    if (options.admit !== undefined) {
      // A rule that fails to answer keeps the gate closed, as a refusal does.
      const isAdmitted = await Promise.resolve()
        .then(() => options.admit?.(claims))
        .catch(() => false);
      if (isAdmitted !== true) return { opened: false, reason: "rule", claims };
    }
    const opened = await this.gate.open();
    if (!opened.ok) return { opened: false, reason: "gate", claims };
    this.used.add(claims.receiptId);
    if (this.used.size > REMEMBERED) this.used.delete(this.used.values().next().value as string);
    return { opened: true, claims };
  }
}
