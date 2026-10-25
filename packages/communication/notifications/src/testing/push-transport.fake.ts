/**
 * Stackra file contract:
 * Purpose: `PushTransportFake`, the test double of the `PushTransport` port: keeps every push it is handed, answers a
 *          repeated idempotency key with the first outcome, treats the devices a test marks gone as revoked, and lists
 *          what was sent (`sent()`).
 * Boundary: a plain subclass of the port, so it binds in place of `PushTransport`; not a driver. Ids are `fake_<n>`.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: a fake per capability); ADR 0269 (decision 3).
 */
import { PushTransport } from "#contracts/index";
import type { OutboundPush, PushOutcome } from "#contracts/index";

/**
 * A push transport a test reads back.
 *
 * @example
 * const push = new PushTransportFake(["ExponentPushToken[gone]"]);
 * await push.send({ target, title, body, ttlSeconds: 60 }, "k1");
 */
export class PushTransportFake extends PushTransport {
  /** Keyed by idempotency key, in send order. */
  private readonly pushes = new Map<
    string,
    { readonly outcome: PushOutcome; readonly push: OutboundPush }
  >();

  /** Expo tokens or Web Push endpoints the fake reports gone. */
  private readonly gone: ReadonlySet<string>;

  /** @param gone - the devices to answer `revoked` for. */
  constructor(gone: readonly string[] = []) {
    super();
    this.gone = new Set(gone);
  }

  /** Keeps `push` and returns its outcome; a repeated key returns the first outcome. */
  send(push: OutboundPush, idempotencyKey: string): Promise<PushOutcome> {
    const existing = this.pushes.get(idempotencyKey);
    if (existing !== undefined) return Promise.resolve(existing.outcome);
    const device = push.target.kind === "expo" ? push.target.token : push.target.endpoint;
    const outcome: PushOutcome = this.gone.has(device)
      ? { status: "revoked" }
      : { status: "sent", providerId: `fake_${this.pushes.size + 1}` };
    this.pushes.set(idempotencyKey, { outcome, push });
    return Promise.resolve(outcome);
  }

  /** Every push kept, in send order. */
  sent(): readonly OutboundPush[] {
    return [...this.pushes.values()].map((entry) => entry.push);
  }
}
