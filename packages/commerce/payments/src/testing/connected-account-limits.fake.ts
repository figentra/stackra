/**
 * Stackra file contract:
 * Purpose: `ConnectedAccountLimitsFake`, the cap and payout hold of connected accounts for tests: no cap and no hold
 *          unless a test sets them per connection.
 * Boundary: test support from `./testing`; never bound in production. It records which connections it was asked
 *           about, so a test can prove another mode never asks.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fakes in ./testing); R4-6.
 */
import type { Money } from "@stackra/money";

import { ConnectedAccountLimits } from "#contracts/ports/connected-account-limits.port";

/**
 * Connected-account limits a test sets.
 *
 * @example
 * const limits = ConnectedAccountLimitsFake.with({ caps: { conn_1: Money.ofMinor(50_000, "USD") } });
 */
export class ConnectedAccountLimitsFake extends ConnectedAccountLimits {
  /** Every connection id the engine asked about, in order. */
  readonly asked: string[] = [];

  /** Caps by connection id. */
  private caps: Readonly<Record<string, Money>> = {};

  /** Connections whose payouts are held. */
  private held: ReadonlySet<string> = new Set();

  // A constructor takes class tokens only (ADR 0294 rule 17), so `with` fills the fields.
  private constructor() {
    super();
  }

  /** A fake with `options.caps` and `options.held`; none of either when left out. */
  static with(
    options: {
      readonly caps?: Readonly<Record<string, Money>>;
      readonly held?: readonly string[];
    } = {},
  ): ConnectedAccountLimitsFake {
    const fake = new ConnectedAccountLimitsFake();
    fake.caps = options.caps ?? {};
    fake.held = new Set(options.held ?? []);
    return fake;
  }

  /** The cap set for `connectionId`, or null; records the question. */
  async cap(connectionId: string): Promise<Money | null> {
    this.asked.push(connectionId);
    return this.caps[connectionId] ?? null;
  }

  /** Whether `connectionId` was set as held; records the question. */
  async payoutHeld(connectionId: string): Promise<boolean> {
    this.asked.push(connectionId);
    return this.held.has(connectionId);
  }
}
