/**
 * Stackra file contract:
 * Purpose: `readInterchange(text)`, reads an X12 or EDIFACT interchange, telling them apart by the first segment tag
 *          (`ISA`; `UNA` or `UNB`).
 * Boundary: dispatch only; `readX12` and `readEdifact` hold the rules. Refuses other text with `MalformedEdiError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6).
 */
import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import { MalformedEdiError } from "#core/edi/malformed-edi.error";
import { readEdifact } from "#core/edi/read-edifact.function";
import { readX12 } from "#core/edi/read-x12.function";

/**
 * The interchange in `text`.
 *
 * @throws MalformedEdiError when it is neither syntax or its envelope is broken.
 * @example
 * const interchange = readInterchange(file.interchange);
 */
export function readInterchange(text: string): EdiInterchange {
  const head = text.trimStart().slice(0, 3);
  if (head === "ISA") return readX12(text);
  if (head === "UNA" || head === "UNB") return readEdifact(text);
  throw MalformedEdiError.create({
    syntax: "unknown",
    reason: "neither an ISA nor a UNA or UNB header",
  });
}
