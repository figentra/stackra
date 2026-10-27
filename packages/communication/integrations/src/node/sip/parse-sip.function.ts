/**
 * Stackra file contract:
 * Purpose: `parseSip`, the SIP message parser of the SIP trunk driver: start line, folded and compact headers, comma
 *          lists of `Via`, `Route` and `Record-Route`, and the body cut at `Content-Length` (bytes).
 * Boundary: a pure function over one datagram's text. A malformed message is a `RangeError`; the driver drops it.
 * Runtime: node
 * Governing contract: RFC 3261 (sections 7 and 20); ADR 0376 (decision 7: the SIP driver).
 */
import type { SipMessage } from "#node/sip/sip-message.type";

/** RFC 3261 section 20 compact forms (and RFC 3515/3892 for REFER). */
const COMPACT: Readonly<Record<string, string>> = {
  i: "Call-ID",
  f: "From",
  t: "To",
  v: "Via",
  m: "Contact",
  l: "Content-Length",
  c: "Content-Type",
  k: "Supported",
  o: "Event",
  r: "Refer-To",
  b: "Referred-By",
};

/** Headers whose comma-separated values are separate entries. */
const LISTS = new Set(["via", "route", "record-route"]);

/**
 * The message in `text`.
 *
 * @example
 * const response = parseSip(new TextDecoder().decode(datagram));
 * if (response.status === 200) confirm(response);
 * @throws RangeError when `text` is not a SIP message.
 */
export function parseSip(text: string): SipMessage {
  const end = text.indexOf("\r\n\r\n");
  if (end < 0) throw new RangeError("not a SIP message: no end of headers");
  const [start = "", ...lines] = text.slice(0, end).split("\r\n");
  const unfolded: string[] = [];
  for (const line of lines) {
    // A line starting with white space continues the header above (RFC 3261 section 7.3.1).
    if (/^[ \t]/.test(line) && unfolded.length > 0)
      unfolded[unfolded.length - 1] += ` ${line.trim()}`;
    else unfolded.push(line);
  }
  const headers: (readonly [string, string])[] = [];
  for (const line of unfolded) {
    const colon = line.indexOf(":");
    if (colon <= 0) throw new RangeError("not a SIP message: a header without a name");
    const raw = line.slice(0, colon).trim();
    const name = COMPACT[raw.toLowerCase()] ?? raw;
    const value = line.slice(colon + 1).trim();
    if (LISTS.has(name.toLowerCase()))
      for (const part of splitList(value)) headers.push([name, part]);
    else headers.push([name, value]);
  }
  const length = headers.find(([name]) => name.toLowerCase() === "content-length")?.[1];
  const rest = new TextEncoder().encode(text.slice(end + 4));
  const body = new TextDecoder().decode(
    length === undefined ? rest : rest.subarray(0, Number(length)),
  );
  const response = /^SIP\/2\.0 (\d{3}) ?(.*)$/.exec(start);
  if (response !== null)
    return { status: Number(response[1]), reason: response[2] ?? "", headers, body };
  const request = /^([A-Z]+) (\S+) SIP\/2\.0$/.exec(start);
  if (request === null) throw new RangeError("not a SIP message: bad start line");
  return { method: request[1] ?? "", uri: request[2] ?? "", headers, body };
}

/** `value` split at commas outside `<…>` and quotes. */
function splitList(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quoted = false;
  let from = 0;
  for (let at = 0; at < value.length; at += 1) {
    const char = value[at];
    if (char === '"') quoted = !quoted;
    else if (!quoted && char === "<") depth += 1;
    else if (!quoted && char === ">") depth -= 1;
    else if (!quoted && depth === 0 && char === ",") {
      parts.push(value.slice(from, at).trim());
      from = at + 1;
    }
  }
  parts.push(value.slice(from).trim());
  return parts.filter((part) => part !== "");
}
