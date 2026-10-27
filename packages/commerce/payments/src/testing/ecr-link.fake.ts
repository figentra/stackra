/**
 * Stackra file contract:
 * Purpose: `EcrLinkFake`, an `EcrLink` that replays recorded terminal answers for tests: each `exchange` takes the
 *          next queued answer (text, or a lost answer), and every call is recorded with all its arguments, decoded.
 * Boundary: test support from `./testing`; no device, no framing. An answer queued with `hold` waits until `release`,
 *           so a test can cancel while a sale is running. Recorded answers are fixtures, not a provider's certified
 *           messages.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fakes in ./testing); ADR 0377 (decisions 1 and 2).
 */
import type { EcrLink } from "#contracts/types/ecr-link.type";
import type { EcrTiming } from "#contracts/types/ecr-timing.type";
import type { EcrLinkCall } from "#testing/ecr-link-call.type";

/** A queued answer: the answer text, `lost` for no answer, or a held answer released later. */
type Queued =
  | { readonly text: string }
  | { readonly lost: true }
  | { readonly held: Promise<string> };

/**
 * Recorded answers.
 *
 * @example
 * const link = EcrLinkFake.answering("01|chk_9|00|RRN1|2500|0");
 * const gateway = new EcrTerminalGateway({ id: "till-1", profile, link, currency: "SAR" });
 */
export class EcrLinkFake implements EcrLink {
  /** Every call, in order. */
  readonly calls: EcrLinkCall[] = [];

  /** Whether `signal` rejects (the terminal does not acknowledge). */
  isSignalLost = false;

  /** Answers still to give. */
  private readonly queue: Queued[] = [];

  /** Releases the held answer, with its text. */
  private releaseHeld: ((text: string) => void) | null = null;

  /** A fake that gives `answers` in order. */
  static answering(...answers: string[]): EcrLinkFake {
    const fake = new EcrLinkFake();
    for (const text of answers) fake.answer(text);
    return fake;
  }

  /** Queues an answer. */
  answer(text: string): this {
    this.queue.push({ text });
    return this;
  }

  /** Queues a lost answer: that exchange rejects. */
  lose(): this {
    this.queue.push({ lost: true });
    return this;
  }

  /** Queues an answer given only when `release` is called. */
  hold(): this {
    this.queue.push({ held: new Promise<string>((resolve) => (this.releaseHeld = resolve)) });
    return this;
  }

  /** Gives the held answer. */
  release(text: string): void {
    this.releaseHeld?.(text);
    this.releaseHeld = null;
  }

  /** Records the call and gives the next queued answer. */
  async exchange(payload: Uint8Array, timing: EcrTiming): Promise<Uint8Array> {
    this.calls.push({ kind: "exchange", payload: new TextDecoder().decode(payload), timing });
    const next = this.queue.shift();
    if (next === undefined || "lost" in next) throw new Error("ECR answer lost");
    const text = "held" in next ? await next.held : next.text;
    return new TextEncoder().encode(text);
  }

  /** Records the call; rejects while `isSignalLost`. */
  async signal(payload: Uint8Array, timing: EcrTiming): Promise<void> {
    this.calls.push({ kind: "signal", payload: new TextDecoder().decode(payload), timing });
    if (this.isSignalLost) throw new Error("ECR signal not acknowledged");
  }
}
