/**
 * Stackra file contract:
 * Purpose: `parsePage`, an HTML document as a page reading: its title and language, its readable text (scripts,
 *          styles, comments and markup removed, one block per line, entities decoded) and the products its schema.org
 *          JSON-LD markup describes (`Product`, inside `@graph` or arrays, and the variants of a `ProductGroup`).
 * Boundary: pure; shared by both `PageReader` drivers. It reads markup with patterns, never runs it, and never throws on
 *           bad HTML or bad JSON-LD (a block that does not parse is skipped). Relative URLs resolve against `baseUrl`;
 *           only http(s) URLs are kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0450 (decision 2); STA-904 (page reader).
 */
import type { PageReading } from "#contracts/types/page-reading.type";
import type { ProductHint } from "#contracts/types/product-hint.type";

/** Elements whose content is never readable text. */
const HIDDEN = /<(script|style|noscript|template|svg|iframe|head)\b[\s\S]*?<\/\1\s*>/gi;

/** Tags that end a line of text. */
const BLOCK =
  /<\/?(?:p|div|br|li|ul|ol|h[1-6]|tr|td|th|table|section|article|header|footer|main|nav|aside|blockquote|pre|hr|dd|dt|figcaption|form|label|button)\b[^>]*>/gi;

/** A JSON-LD block. */
const JSON_LD =
  /<script\b[^>]*\btype\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi;

/** The named entities a page uses for text; numeric entities are decoded too. */
const NAMED: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** `text` with its character references decoded; an unknown one is kept as written. */
function decode(text: string): string {
  return text.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (whole, ref: string) => {
    if (!ref.startsWith("#")) return NAMED[ref.toLowerCase()] ?? whole;
    const code = /^#x/i.test(ref) ? Number.parseInt(ref.slice(2), 16) : Number(ref.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

/** A trimmed non-empty string or number as a string, else undefined. */
function textOf(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return undefined;
  const trimmed = decode(value).trim();
  return trimmed === "" ? undefined : trimmed;
}

/** `value` as an absolute http(s) URL against `base`, else undefined. */
function urlOf(value: unknown, base: string): string | undefined {
  const text = textOf(value);
  if (text === undefined) return undefined;
  try {
    const url = new URL(text, base);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** `value` as a list: itself when an array, else a one-item list (none when absent). */
function listOf(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

/** `value` as a plain object, else undefined. */
function recordOf(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** The hint of one schema.org `Product` node, or undefined when it has no name. */
function hintOf(node: Readonly<Record<string, unknown>>, base: string): ProductHint | undefined {
  const name = textOf(node["name"]);
  if (name === undefined) return undefined;
  const offer = recordOf(listOf(node["offers"])[0]);
  const brand = recordOf(node["brand"]);
  const images = listOf(node["image"])
    .map((image) => urlOf(recordOf(image)?.["url"] ?? image, base))
    .filter((image): image is string => image !== undefined);
  const fields = {
    description: textOf(node["description"]),
    sku: textOf(node["sku"]),
    brand: textOf(brand === undefined ? node["brand"] : brand["name"]),
    url: urlOf(node["url"] ?? offer?.["url"], base),
    price: textOf(offer?.["price"] ?? offer?.["lowPrice"]),
    currency: textOf(offer?.["priceCurrency"]),
    availability: textOf(offer?.["availability"])?.replace(/^https?:\/\/schema\.org\//i, ""),
  };
  // Optional fields are left out, not set to undefined (exactOptionalPropertyTypes).
  const present = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Omit<ProductHint, "name" | "images">;
  return Object.freeze({ name, images, ...present });
}

/** Walks a JSON-LD value and pushes every `Product` it holds onto `into`. */
function collect(value: unknown, base: string, into: ProductHint[]): void {
  for (const item of listOf(value)) {
    const node = recordOf(item);
    if (node === undefined) continue;
    const types = listOf(node["@type"]);
    if (types.includes("Product")) {
      const hint = hintOf(node, base);
      if (hint !== undefined) into.push(hint);
    }
    collect(node["@graph"], base, into);
    if (types.includes("ProductGroup")) collect(node["hasVariant"], base, into);
  }
}

/**
 * The reading of `html`, read from `baseUrl`, with its text cut at `maxTextChars` when given.
 *
 * @example
 * const reading = parsePage(html, "https://shop.example.com/", 20_000);
 * reading.products[0]?.price; // "129.00"
 */
export function parsePage(
  html: string,
  baseUrl: string,
  maxTextChars?: number,
): Omit<PageReading, "url" | "status"> {
  // shortcut: patterns, not an HTML parser; enough for title, text and JSON-LD. Upgrade if readings miss content.
  const title = textOf(
    /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html)?.[1]?.replace(/\s+/g, " "),
  );
  const lang = /<html\b[^>]*\blang\s*=\s*["']?([A-Za-z0-9-]+)/i.exec(html)?.[1];
  const products: ProductHint[] = [];
  for (const block of html.matchAll(JSON_LD)) {
    try {
      collect(JSON.parse(block[1] ?? ""), baseUrl, products);
    } catch {
      // A block that is not JSON is the page's mistake; the rest of the page still reads.
    }
  }
  const full = decode(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(HIDDEN, " ")
      .replace(BLOCK, "\n")
      .replace(/<[^>]*>/g, " "),
  )
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .filter((line) => line !== "")
    .join("\n");
  const truncated = maxTextChars !== undefined && full.length > maxTextChars;
  return Object.freeze({
    ...(title === undefined ? {} : { title }),
    ...(lang === undefined ? {} : { lang }),
    text: truncated ? full.slice(0, maxTextChars) : full,
    truncated,
    products: Object.freeze(products),
  });
}
