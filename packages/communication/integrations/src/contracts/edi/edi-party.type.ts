/**
 * Stackra file contract:
 * Purpose: `EdiParty`, an interchange sender or receiver: its id and the qualifier that says what kind of id it is.
 * Boundary: a type only. An `EdiDocument.partner` written as `<qualifier>:<id>` ("ZZ:ACME", "14:5012345678901") is a
 *           party in text form; trading partners are per-Connection data, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */

/** An interchange party. */
export interface EdiParty {
  /** The id qualifier (X12 ISA05 such as `ZZ` or `01`; EDIFACT S002 0007 such as `14` for a GLN). */
  readonly qualifier: string;

  /** The id (an X12 ISA06 of at most 15 characters, a GLN, a DUNS number). */
  readonly id: string;
}
