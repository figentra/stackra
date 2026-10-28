/**
 * Stackra file contract:
 * Purpose: `htmlToText(html)`, the plain-text part of a rendered mail: the HTML's visible text, a blank line after each
 *          block and a line break per `<br>`, each link's address after its label, and entities decoded.
 * Boundary: public and pure. It reads markup a renderer wrote (React Email, the experience server renderer:
 *           well-formed, attribute values double-quoted), not arbitrary HTML: comments (Outlook conditionals
 *           included), `head`, `style`, `script` and `title` are dropped, images are skipped, and no line is wrapped.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0223 (mail bodies rendered to HTML and text);
 *                     ADR 0270 (decision 6); stackra-224 (one copy, was notifications and experience; the notifications
 *                     form kept).
 */

/** The named entities React and React Email emit; numeric entities are decoded separately. */
const NAMED = new Map([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
  ["nbsp", " "],
]);

/** `text` with its entities decoded; an unknown or invalid entity stays as written. */
function decode(text: string): string {
  return text.replaceAll(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (!body.startsWith("#")) return NAMED.get(body.toLowerCase()) ?? entity;
    const code = /^#x/i.test(body) ? Number.parseInt(body.slice(2), 16) : Number(body.slice(1));
    return code <= 0x10_ff_ff ? String.fromCodePoint(code) : entity;
  });
}

/** A link as text: its label, then its address unless the label already is the address. */
function link(href: string, label: string): string {
  const text = label.replaceAll(/<[^>]*>/g, "").trim();
  if (text === "") return href;
  return text === href ? text : `${text} (${href})`;
}

// shortcut: covers the markup React Email components render; use @react-email/render's toPlainText if mails grow
// tables or lists that need column layout in text.
/**
 * The text part of a mail.
 *
 * @example
 * htmlToText('<html><body><p>Total &amp; tax</p><a href="https://acme.example/o/1">View</a></body></html>');
 * // "Total & tax\n\nView (https://acme.example/o/1)"
 */
export function htmlToText(html: string): string {
  const flat = html
    .replaceAll(/<!--[\s\S]*?-->/g, "")
    .replaceAll(/<!doctype[^>]*>/gi, "")
    .replaceAll(/<(head|style|script|title)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replaceAll(
      /<a\b[^>]*?\shref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      (_match, href: string, label: string) => link(href, label),
    )
    .replaceAll(/<br\s*\/?>/gi, "\n")
    .replaceAll(/<hr\b[^>]*>/gi, "\n\n---\n\n")
    .replaceAll(/<\/t[dh]>/gi, " ")
    .replaceAll(
      /<\/(p|div|h[1-6]|tr|table|li|ul|ol|section|header|footer|blockquote|pre)>/gi,
      "\n\n",
    )
    .replaceAll(/<[^>]*>/g, "");
  return decode(flat)
    .split("\n")
    .map((line) => line.replaceAll(/[ \t\f\v ]+/g, " ").trim())
    .join("\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
}
