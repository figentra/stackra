/**
 * Stackra file contract:
 * Purpose: `writeInterchange(interchange)`, writes an interchange in its own syntax.
 * Boundary: dispatch only; `writeX12` and `writeEdifact` hold the rules.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */
import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import { EdiSyntax } from "#contracts/edi/edi-syntax.enum";
import { writeEdifact } from "#core/edi/write-edifact.function";
import { writeX12 } from "#core/edi/write-x12.function";

/**
 * The wire text of `interchange`.
 *
 * @throws MalformedEdiError when an X12 value cannot be written.
 * @example
 * await mailbox.put(key, writeInterchange(interchange));
 */
export function writeInterchange(interchange: EdiInterchange): string {
  return interchange.syntax === EdiSyntax.X12 ? writeX12(interchange) : writeEdifact(interchange);
}
