/**
 * Stackra file contract:
 * Purpose: `readEdifact(text)`, reads a UN/EDIFACT interchange: the delimiters from UNA (or the defaults), the parties,
 *          control reference, date and test flag from UNB, then every message between UNH and UNT, checking each UNT
 *          count and reference and the UNZ reference. Release-character escapes are undone.
 * Boundary: envelope only; UNG and UNE group segments are passed over, the body segments are returned as read.
 *           Refuses with `MalformedEdiError`. Internal to `readInterchange`.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 4); stackra-46 re-scope (R2-7, M6); ISO 9735 (UNA, UNB, UNH).
 */
import type { EdiElement } from "#contracts/edi/edi-element.type";
import type { EdiInterchange } from "#contracts/edi/edi-interchange.type";
import type { EdiMessage } from "#contracts/edi/edi-message.type";
import type { EdiParty } from "#contracts/edi/edi-party.type";
import { EdiSyntax } from "#contracts/edi/edi-syntax.enum";
import { MalformedEdiError } from "#core/edi/malformed-edi.error";
import { splitEdi } from "#core/edi/split-edi.function";

/** Refuses with `reason`. */
function malformed(reason: string): MalformedEdiError {
  return MalformedEdiError.create({ syntax: EdiSyntax.Edifact, reason });
}

/** The components of `element`. */
function parts(element: EdiElement | undefined): readonly string[] {
  if (element === undefined) return [];
  return typeof element === "string" ? [element] : element;
}

/** The party in `element` (id, then qualifier). */
function party(element: EdiElement | undefined): EdiParty {
  const [id = "", qualifier = ""] = parts(element);
  return { qualifier, id };
}

/**
 * The interchange in `text`.
 *
 * @throws MalformedEdiError when the envelope is broken.
 * @example
 * readEdifact("UNA:+.? 'UNB+UNOC:3+…'UNH+1+ORDERS:D:96A:UN'…'UNT+3+1'UNZ+1+1'").messages[0]?.code; // "ORDERS"
 */
export function readEdifact(text: string): EdiInterchange {
  let body = text.trimStart();
  let [component, element, release, terminator]: (string | undefined)[] = [":", "+", "?", "'"];
  if (body.startsWith("UNA")) {
    [component, element, release, terminator] = [3, 4, 6, 8].map((index) => body.charAt(index));
    if (release === " ") release = undefined;
    body = body.slice(9);
  }
  const segments = splitEdi(body, terminator ?? "'", release)
    .map((segment) => segment.replace(/^[\r\n]+|[\r\n]+$/g, ""))
    .filter((segment) => segment !== "")
    .map((segment) =>
      splitEdi(segment, element ?? "+", release).map((value): EdiElement => {
        const components = splitEdi(value, component ?? ":", release, true);
        return components.length > 1 ? components : (components[0] ?? "");
      }),
    );
  const unb = segments[0] ?? [];
  if (unb[0] !== "UNB") throw malformed("no UNB header");
  const first = (fields: readonly EdiElement[], index: number): string =>
    parts(fields[index])[0] ?? "";
  const [date = "", time = ""] = parts(unb[4]);
  const year = date.length === 8 ? Number(date.slice(0, 4)) : 2000 + Number(date.slice(0, 2));
  const [mm, dd] = [date.length - 4, date.length - 2].map((start) =>
    Number(date.slice(start, start + 2)),
  );
  const messages: EdiMessage[] = [];
  let open:
    | { code: string; control: string; version: string; segments: EdiElement[][] }
    | undefined;
  let closed = false;
  for (const fields of segments.slice(1)) {
    const tag = first(fields, 0);
    if (tag === "UNG" || tag === "UNE") continue;
    if (tag === "UNH") {
      const [code = "", ...version] = parts(fields[2]);
      open = { code, control: first(fields, 1), version: version.join(":"), segments: [] };
    } else if (tag === "UNT") {
      if (open === undefined) throw malformed("UNT outside a message");
      if (Number(first(fields, 1)) !== open.segments.length + 2)
        throw malformed(
          `UNT count ${first(fields, 1)} differs from ${open.segments.length + 2} segments`,
        );
      if (first(fields, 2) !== open.control) throw malformed("UNT reference differs from UNH");
      messages.push(open);
      open = undefined;
    } else if (tag === "UNZ") {
      if (first(fields, 2) !== first(unb, 5)) throw malformed("UNZ reference differs from UNB");
      closed = true;
    } else if (open === undefined) throw malformed(`${tag} outside a message`);
    else open.segments.push(fields);
  }
  if (!closed) throw malformed("no UNZ trailer");
  return {
    syntax: EdiSyntax.Edifact,
    sender: party(unb[2]),
    receiver: party(unb[3]),
    control: first(unb, 5),
    at: new Date(
      Date.UTC(year, (mm ?? 1) - 1, dd ?? 1, Number(time.slice(0, 2)), Number(time.slice(2, 4))),
    ),
    test: first(unb, 11) === "1",
    version: messages[0]?.version ?? "",
    messages,
  };
}
