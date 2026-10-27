/**
 * Stackra file contract:
 * Purpose: `TurnoverCipherFake`, a deterministic `TurnoverCipher`: base64 of the unit, receipt number and counter.
 * Boundary: built on `Fake` of @stackra/testing; no key and no secrecy, for tests only.
 * Runtime: isomorphic
 * Governing contract: ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { Fake } from "@stackra/testing";

import { TurnoverCipher } from "#contracts/ports/turnover-cipher.port";
import { toBase64 } from "#core/functions/to-base64.function";

/**
 * Encrypts nothing, visibly.
 *
 * @example
 * await new TurnoverCipherFake().encrypt("till_1", "R-1", 3500); // base64 of "till_1:R-1:3500"
 */
export class TurnoverCipherFake extends Fake.of(TurnoverCipher) {
  /** Every input, whole and in order; `calls("encrypt")` holds only the unit ids. */
  readonly inputs: {
    readonly unitId: string;
    readonly receiptNumber: string;
    readonly turnoverMinor: number;
  }[] = [];

  /** Recorded, then the readable stand-in. */
  async encrypt(unitId: string, receiptNumber: string, turnoverMinor: number): Promise<string> {
    this.record("encrypt", unitId);
    this.inputs.push({ unitId, receiptNumber, turnoverMinor });
    return toBase64(`${unitId}:${receiptNumber}:${turnoverMinor}`);
  }
}
