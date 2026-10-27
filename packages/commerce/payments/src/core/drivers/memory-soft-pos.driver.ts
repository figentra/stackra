/**
 * Stackra file contract:
 * Purpose: `MemorySoftPosDriver`, an in-memory `SoftPos` for tests and the staff app's development build: the phone is
 *          ready once connected, a collect answers with the state the test set (authorised by default), and a cancel
 *          is recorded.
 * Boundary: the memory driver every port ships before its device ones (ADR 0266); its name is the file prefix
 *           (`memory`). Isomorphic, so it ships from the `.` entry. It reads no card.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0266 (decision 2); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { SoftPos } from "#contracts/ports/soft-pos.port";
import type { SoftPosReadiness } from "#contracts/types/soft-pos-readiness.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";

/**
 * A phone that always reads.
 *
 * @example
 * const softPos = new MemorySoftPosDriver().answer(PaymentStatus.Captured);
 */
export class MemorySoftPosDriver extends Driver(SoftPos) {
  /** The site the phone is connected at, once connected. */
  location: string | undefined;

  /** How many cancels were asked for. */
  cancels = 0;

  /** The state a collect answers with. */
  private status: PaymentStatus = PaymentStatus.Authorized;

  /** Sets the state the next collects answer with; returns this driver. */
  answer(status: PaymentStatus): this {
    this.status = status;
    return this;
  }

  /** Ready once connected. */
  async readiness(): Promise<SoftPosReadiness> {
    return this.location === undefined
      ? { ready: false, reason: "not_connected" }
      : { ready: true };
  }

  /** Connects at `location`. */
  async connect(location: string): Promise<void> {
    this.location = location;
  }

  /** `session` in the set state. */
  async collect(session: TerminalSession): Promise<TerminalSession> {
    return { ...session, status: this.status };
  }

  /** Counts the cancel. */
  async cancel(): Promise<void> {
    this.cancels += 1;
  }
}
