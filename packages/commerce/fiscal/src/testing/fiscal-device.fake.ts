/**
 * Stackra file contract:
 * Purpose: `FiscalDeviceFake`, a `FiscalDevice` that answers each command from a fixed map and records every call in `sent`.
 * Boundary: built on `Fake` of @stackra/testing. A command with no answer throws, as an unpaired device does.
 * Runtime: isomorphic
 * Governing contract: ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { Fake } from "@stackra/testing";

import { FiscalDevice } from "#contracts/ports/fiscal-device.port";

/**
 * Answers by command.
 *
 * @example
 * const device = FiscalDeviceFake.with({ "tse.transaction": { transactionNumber: 1, … } });
 */
export class FiscalDeviceFake extends Fake.of(FiscalDevice) {
  /** Every call, whole and in order; `calls("call")` holds only the unit ids, as `Fake` records first arguments. */
  readonly sent: {
    readonly unitId: string;
    readonly command: string;
    readonly payload: Readonly<Record<string, unknown>>;
  }[] = [];

  /** Answers by command. */
  private readonly answers: ReadonlyMap<string, unknown>;

  /**
   * @param answers - answers by command.
   */
  constructor(answers: ReadonlyMap<string, unknown>) {
    super();
    this.answers = answers;
  }

  /** Shorthand for a fake over a plain object. */
  static with(answers: Readonly<Record<string, unknown>>): FiscalDeviceFake {
    return new FiscalDeviceFake(new Map(Object.entries(answers)));
  }

  /** Recorded, then the command's answer; throws for an unknown command. */
  async call(
    unitId: string,
    command: string,
    payload: Readonly<Record<string, unknown>>,
  ): Promise<unknown> {
    this.record("call", unitId);
    this.sent.push({ unitId, command, payload });
    if (!this.answers.has(command)) throw new Error(`FiscalDeviceFake: no answer for ${command}`);
    return this.answers.get(command);
  }
}
