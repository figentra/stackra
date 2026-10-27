/**
 * Stackra file contract:
 * Purpose: `writeX12(interchange)`, writes an ASC X12 interchange: the fixed-width ISA, one functional group per GS01
 *          code (from `EDI_MESSAGE_CODES`), each transaction set between ST and SE with its count, and the GE and IEA
 *          trailers. Delimiters are `*`, `>` and `~`, one segment per line.
 * Boundary: envelope only; refuses with `MalformedEdiError` a value holding a delimiter, a party id over 15
 *           characters, a control number that is not 1 to 9 digits, or a message code with no functional group.
 *           Internal to `writeInterchange`.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6); ASC X12 envelope (ISA, GS, ST).
 */
import type { EdiElement } from "#contracts/edi/edi-element.type";
import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import type { EdiMessage } from "#contracts/edi/edi-message.type";
import { EdiSyntax } from "#contracts/edi/edi-syntax.enum";
import { EDI_MESSAGE_CODES } from "#core/edi/edi-message-codes.constant";
import { MalformedEdiError } from "#core/edi/malformed-edi.error";

/** Refuses with `reason`. */
function malformed(reason: string): MalformedEdiError {
  return MalformedEdiError.create({ syntax: EdiSyntax.X12, reason });
}

/** `value` checked for delimiters. */
function plain(value: string): string {
  if (/[*>~]/.test(value)) throw malformed("a value holds a delimiter");
  return value;
}

/** One segment as text. */
function segment(fields: readonly EdiElement[]): string {
  return `${fields.map((field) => (typeof field === "string" ? plain(field) : field.map(plain).join(">"))).join("*")}~`;
}

/**
 * The wire text of `interchange`.
 *
 * @throws MalformedEdiError when a value cannot be written.
 * @example
 * writeX12({ syntax: "x12", sender, receiver, control: "1", at, test: true, version: "00401", messages: [order] });
 */
export function writeX12(interchange: EdiInterchange): string {
  const { sender, receiver, control, at, version } = interchange;
  if (!/^\d{1,9}$/.test(control)) throw malformed("the control number is not 1 to 9 digits");
  for (const party of [sender, receiver])
    if (party.id.length > 15 || party.qualifier.length > 2)
      throw malformed("a party id is too long");
  const iso = at.toISOString();
  const date = iso.slice(0, 10).replaceAll("-", "");
  const time = iso.slice(11, 16).replace(":", "");
  const lines = [
    `${[
      "ISA",
      "00",
      " ".repeat(10),
      "00",
      " ".repeat(10),
      plain(sender.qualifier).padEnd(2),
      plain(sender.id).padEnd(15),
      plain(receiver.qualifier).padEnd(2),
      plain(receiver.id).padEnd(15),
      date.slice(2),
      time,
      version < "00402" ? "U" : "^",
      plain(version),
      control.padStart(9, "0"),
      "0",
      interchange.test ? "T" : "P",
      ">",
    ].join("*")}~`,
  ];
  const groups = new Map<string, EdiMessage[]>();
  for (const message of interchange.messages) {
    const code = Object.values(EDI_MESSAGE_CODES).find((row) => row.x12 === message.code)?.group;
    if (code === undefined) throw malformed(`no functional group for ${message.code}`);
    groups.set(code, [...(groups.get(code) ?? []), message]);
  }
  [...groups].forEach(([code, messages], index) => {
    const group = String(Number(control) + index);
    lines.push(
      segment(["GS", code, sender.id, receiver.id, date, time, group, "X", `${version}0`]),
    );
    for (const message of messages) {
      lines.push(segment(["ST", message.code, message.control]));
      lines.push(...message.segments.map(segment));
      lines.push(segment(["SE", String(message.segments.length + 2), message.control]));
    }
    lines.push(segment(["GE", String(messages.length), group]));
  });
  lines.push(segment(["IEA", String(groups.size), control.padStart(9, "0")]));
  return `${lines.join("\n")}\n`;
}
