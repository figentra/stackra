/**
 * Stackra file contract:
 * Purpose: `EdiInterchange`, one EDI interchange as the envelope reads and writes it: syntax, sender, receiver,
 *          control number, date, test flag, version and its messages.
 * Boundary: a type only. `readInterchange` and `writeInterchange` in `.` convert it to and from the wire text.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */
import type { EdiMessage } from "#contracts/edi/edi-message.type";
import type { EdiParty } from "#contracts/edi/edi-party.type";
import type { EdiSyntax } from "#contracts/edi/edi-syntax.enum";

/** An interchange. */
export interface EdiInterchange {
  /** X12 or EDIFACT. */
  readonly syntax: EdiSyntax;

  /** Who sends it (ISA05 and ISA06, UNB S002). */
  readonly sender: EdiParty;

  /** Who receives it (ISA07 and ISA08, UNB S003). */
  readonly receiver: EdiParty;

  /** The interchange control number (ISA13, UNB 0020), digits; X12 pads it to nine. */
  readonly control: string;

  /** When it was prepared (ISA09 and ISA10, UNB S004), UTC to the minute. */
  readonly at: Date;

  /** A test interchange (ISA15 `T`, UNB 0035 `1`). */
  readonly test: boolean;

  /** X12: the ISA12 version (`00401`); EDIFACT: the message version (`D:96A:UN`). */
  readonly version: string;

  /** Its messages, in order. */
  readonly messages: readonly EdiMessage[];
}
