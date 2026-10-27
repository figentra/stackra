/**
 * Stackra file contract:
 * Purpose: `writeEdifact(interchange)`, writes a UN/EDIFACT interchange: the UNA service string advice, UNB with the
 *          parties, date, control reference and test indicator, each message between UNH and UNT with its count, and
 *          UNZ. Delimiters are the UNA defaults; `?`, `:`, `+` and `'` in a value are escaped. One segment per line.
 * Boundary: envelope only. The syntax identifier is `UNOC:3` (Latin-1); a partner that needs another is not served yet.
 *           Internal to `writeInterchange`.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6); ISO 9735 (UNA, UNB, UNH).
 */
import type { EdiElement } from "#contracts/edi/edi-element.type";
import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import type { EdiParty } from "#contracts/edi/edi-party.type";

/** `value` with its delimiters escaped. */
function escape(value: string): string {
  return value.replace(/[?:+']/g, "?$&");
}

/** One segment as text. */
function segment(fields: readonly EdiElement[]): string {
  return `${fields.map((field) => (typeof field === "string" ? escape(field) : field.map(escape).join(":"))).join("+")}'`;
}

/** A party element (id, then qualifier when there is one). */
function party(value: EdiParty): EdiElement {
  return value.qualifier === "" ? value.id : [value.id, value.qualifier];
}

/**
 * The wire text of `interchange`.
 *
 * @example
 * writeEdifact({ syntax: "edifact", sender, receiver, control: "1", at, test: true, version: "D:96A:UN", messages: [order] });
 */
export function writeEdifact(interchange: EdiInterchange): string {
  const iso = interchange.at.toISOString();
  const unb: EdiElement[] = [
    "UNB",
    ["UNOC", "3"],
    party(interchange.sender),
    party(interchange.receiver),
    [iso.slice(2, 10).replaceAll("-", ""), iso.slice(11, 16).replace(":", "")],
    interchange.control,
  ];
  if (interchange.test) unb.push("", "", "", "", "", "1");
  const lines = ["UNA:+.? '", segment(unb)];
  for (const message of interchange.messages) {
    const version = (message.version ?? interchange.version).split(":");
    lines.push(segment(["UNH", message.control, [message.code, ...version]]));
    lines.push(...message.segments.map(segment));
    lines.push(segment(["UNT", String(message.segments.length + 2), message.control]));
  }
  lines.push(segment(["UNZ", String(interchange.messages.length), interchange.control]));
  return `${lines.join("\n")}\n`;
}
