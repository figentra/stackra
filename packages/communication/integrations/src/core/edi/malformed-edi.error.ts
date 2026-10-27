/**
 * Stackra file contract:
 * Purpose: `MalformedEdiError` (`malformed_edi`), the refusal of interchange text the envelope cannot read (a missing
 *          or broken header, a trailer whose count or control number differs, a message outside the canonical set) or
 *          of a value it cannot write (an X12 value holding a delimiter, a party id too long).
 * Boundary: kind `Validation`, never retryable. Its details are the syntax and the reason, never the interchange,
 *           which carries trading data.
 * Runtime: isomorphic
 * Governing contract: ADR 0140; ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The interchange cannot be read or written.
 *
 * @example
 * throw MalformedEdiError.create({ syntax: "x12", reason: "SE count 4 differs from 5 segments" });
 */
export class MalformedEdiError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** `x12` or `edifact`. */
  syntax!: string;

  /** What is wrong, naming segments and counts only. */
  reason!: string;
}
