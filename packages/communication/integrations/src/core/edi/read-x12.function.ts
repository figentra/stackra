/**
 * Stackra file contract:
 * Purpose: `readX12(text)`, reads an ASC X12 interchange: the delimiters from the fixed-width ISA, the parties,
 *          control number, date and test flag, then every transaction set of every functional group, checking each SE
 *          count and control number and the IEA control number.
 * Boundary: envelope only; the body segments are returned as read. Refuses with `MalformedEdiError`. Internal to
 *           `readInterchange`.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6); ASC X12 envelope (ISA, GS, ST).
 */
import type { EdiElement } from "#contracts/edi/edi-element.type";
import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import type { EdiMessage } from "#contracts/edi/edi-message.type";
import { EdiSyntax } from "#contracts/edi/edi-syntax.enum";
import { MalformedEdiError } from "#core/edi/malformed-edi.error";

/** Refuses with `reason`. */
function malformed(reason: string): MalformedEdiError {
  return MalformedEdiError.create({ syntax: EdiSyntax.X12, reason });
}

/** The element at `index`, or "" when the segment is shorter. */
function at(fields: readonly string[], index: number): string {
  return fields[index] ?? "";
}

/**
 * The interchange in `text`.
 *
 * @throws MalformedEdiError when the envelope is broken.
 * @example
 * readX12("ISA*00*…~GS*PO*…~ST*850*0001~…~SE*4*0001~GE*1*1~IEA*1*000000001~").messages[0]?.code; // "850"
 */
export function readX12(text: string): EdiInterchange {
  const body = text.trimStart();
  if (!body.startsWith("ISA") || body.length < 106) throw malformed("no ISA header");
  const element = body.charAt(3);
  const component = body.charAt(104);
  const terminator = body.charAt(105);
  const raw = body
    .split(terminator)
    .map((segment) => segment.replaceAll(/^[\r\n]+|[\r\n]+$/g, ""))
    .filter((segment) => segment !== "")
    .map((segment) => segment.split(element));
  const isa = raw[0] ?? [];
  if (isa.length !== 17) throw malformed(`ISA has ${isa.length - 1} elements, not 16`);
  const [yy, mm, dd] = [0, 2, 4].map((start) => Number(at(isa, 9).slice(start, start + 2)));
  const [hh, mi] = [0, 2].map((start) => Number(at(isa, 10).slice(start, start + 2)));
  const messages: EdiMessage[] = [];
  let group: { code: string; control: string } | undefined;
  let open: { code: string; control: string; segments: EdiElement[][] } | undefined;
  let closed = false;
  for (const fields of raw.slice(1)) {
    const tag = at(fields, 0);
    if (tag === "GS") group = { code: at(fields, 1), control: at(fields, 6) };
    else if (tag === "GE") group = undefined;
    else if (tag === "ST") open = { code: at(fields, 1), control: at(fields, 2), segments: [] };
    else if (tag === "SE") {
      if (open === undefined) throw malformed("SE outside a transaction set");
      if (Number(at(fields, 1)) !== open.segments.length + 2)
        throw malformed(
          `SE count ${at(fields, 1)} differs from ${open.segments.length + 2} segments`,
        );
      if (at(fields, 2) !== open.control) throw malformed("SE control differs from ST");
      messages.push(group === undefined ? open : { ...open, group });
      open = undefined;
    } else if (tag === "IEA") {
      if (at(fields, 2) !== at(isa, 13)) throw malformed("IEA control differs from ISA");
      closed = true;
    } else if (open === undefined) throw malformed(`${tag} outside a transaction set`);
    else
      open.segments.push([
        tag,
        ...fields.slice(1).map((value) => {
          const parts = value.split(component);
          return parts.length > 1 ? parts : value;
        }),
      ]);
  }
  if (!closed) throw malformed("no IEA trailer");
  return {
    syntax: EdiSyntax.X12,
    sender: { qualifier: at(isa, 5).trim(), id: at(isa, 6).trim() },
    receiver: { qualifier: at(isa, 7).trim(), id: at(isa, 8).trim() },
    control: at(isa, 13),
    at: new Date(Date.UTC(2000 + (yy ?? 0), (mm ?? 1) - 1, dd ?? 1, hh ?? 0, mi ?? 0)),
    test: at(isa, 15) === "T",
    version: at(isa, 12),
    messages,
  };
}
