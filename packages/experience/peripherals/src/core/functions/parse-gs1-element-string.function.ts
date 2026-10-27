/**
 * Stackra file contract:
 * Purpose: `parseGs1ElementString`, a GS1-128 or GS1 DataBar code (a weighed pack's label, a fresh-food code with its
 *          expiry) read into its application identifiers, with the GTIN, net weight and price a till acts on, after
 *          the GTIN or SSCC check digit is verified.
 * Boundary: pure. It reads the raw form a scanner sends (an optional AIM symbology identifier such as `]C1` or `]e0`,
 *           elements separated by the GS character, U+001D) and the bracketed form printed under the bars
 *           (`(01)09501101530003(3103)001250`). A code whose symbology identifier names no GS1 symbology (`]E0`, an
 *           EAN-13) is not read; without one, a plain retail code may parse, so a till sends prefixed scans or tries
 *           `parseEmbeddedBarcode` first. A code with an identifier missing from `GS1_APPLICATION_IDENTIFIERS`,
 *           a value of the wrong length or kind, an identifier given twice, or a wrong check digit answers `null` (an
 *           ordinary barcode, or a misread to scan again); it never throws. Dates stay as encoded (YYMMDD).
 * Runtime: isomorphic
 * Governing contract: the GS1 General Specifications (application identifiers, element strings); ADR 0339 (decision
 *                     7); STA-965.
 */
import { GS1_APPLICATION_IDENTIFIERS } from "#core/constants/gs1-application-identifiers.constant";
import { gs1CheckDigit } from "#core/functions/gs1-check-digit.function";
import { impliedDecimal } from "#core/functions/implied-decimal.function";
import type { Gs1ElementString } from "#core/types/gs1-element-string.type";

/** The GS1 element separator (FNC1 as a scanner transmits it). */
const GS = "\u001d";

/** The AIM symbology identifiers of the GS1 symbologies: GS1-128, DataBar, DataMatrix, QR Code, DotCode. */
const GS1_SYMBOLOGIES = ["]C1", "]e0", "]d2", "]Q3", "]J1"];

/** The identifiers whose last digit is a GS1 check digit. */
const CHECKED = ["00", "01", "02"];

/**
 * The elements `code` carries, or null when it is not a readable GS1 element string.
 *
 * @example
 * parseGs1ElementString("]e00109501101530003" + "3103001250");
 * // { gtin: "09501101530003", weight: { value: "1.250", unit: "kg" }, price: null, elements, code }
 * parseGs1ElementString("(01)09501101530003(3922)899"); // price: { value: "8.99", currency: null }
 */
export function parseGs1ElementString(code: string): Gs1ElementString | null {
  const symbology = code.startsWith("]") ? code.slice(0, 3) : null;
  if (symbology !== null && !GS1_SYMBOLOGIES.includes(symbology)) return null;
  const body = symbology === null ? code : code.slice(3);
  const pairs = body.startsWith("(") ? bracketed(body) : raw(body);
  if (pairs === null || pairs.length === 0) return null;
  const elements: Record<string, string> = {};
  for (const [ai, value] of pairs) {
    if (ai in elements || !isValid(ai, value)) return null;
    elements[ai] = value;
  }
  for (const ai of CHECKED) {
    const value = elements[ai];
    if (value !== undefined && gs1CheckDigit(value.slice(0, -1)) !== Number(value.slice(-1)))
      return null;
  }
  const keys = Object.keys(elements);
  const weightAi = keys.find((ai) => ai.startsWith("310") || ai.startsWith("320"));
  const priceAi = keys.find((ai) => ai.startsWith("392") || ai.startsWith("393"));
  let price: Gs1ElementString["price"] = null;
  if (priceAi !== undefined) {
    const value = elements[priceAi] as string;
    const isLocal = priceAi.startsWith("392");
    if (!isLocal && value.length < 4) return null;
    price = {
      value: impliedDecimal(isLocal ? value : value.slice(3), Number(priceAi[3])),
      currency: isLocal ? null : value.slice(0, 3),
    };
  }
  return {
    code,
    elements,
    gtin: elements["01"] ?? null,
    weight:
      weightAi === undefined
        ? null
        : {
            value: impliedDecimal(elements[weightAi] as string, Number(weightAi[3])),
            unit: weightAi.startsWith("310") ? "kg" : "lb",
          },
    price,
  };
}

/** The table row of the identifier `text` starts with. */
function identifier(text: string): (typeof GS1_APPLICATION_IDENTIFIERS)[string] | undefined {
  return (
    GS1_APPLICATION_IDENTIFIERS[text.slice(0, 2)] ?? GS1_APPLICATION_IDENTIFIERS[text.slice(0, 3)]
  );
}

/** Whether `value` fits identifier `ai`'s length and kind. */
function isValid(ai: string, value: string): boolean {
  const row = identifier(ai);
  if (row === undefined || row.digits !== ai.length || !/^\d+$/.test(ai)) return false;
  if (row.isFixed ? value.length !== row.length : value.length === 0 || value.length > row.length)
    return false;
  return row.isText ? /^[\x21-\x7e]+$/.test(value) : /^\d+$/.test(value);
}

/** The pairs of the raw form: fixed-length values end by length, the others at a GS or the end. */
function raw(body: string): [string, string][] | null {
  const pairs: [string, string][] = [];
  let at = 0;
  while (at < body.length) {
    if (body[at] === GS) {
      at += 1;
      continue;
    }
    const row = identifier(body.slice(at));
    if (row === undefined) return null;
    const ai = body.slice(at, at + row.digits);
    at += row.digits;
    const separator = body.indexOf(GS, at);
    const end = row.isFixed ? at + row.length : separator === -1 ? body.length : separator;
    pairs.push([ai, body.slice(at, end)]);
    at = end;
  }
  return pairs;
}

/** The pairs of the bracketed form, or null when anything sits outside the brackets' pattern. */
function bracketed(body: string): [string, string][] | null {
  const matches = [...body.matchAll(/\((\d{2,4})\)([^()]+)/g)];
  if (matches.map((match) => match[0]).join("") !== body) return null;
  return matches.map((match) => [match[1] as string, match[2] as string]);
}
