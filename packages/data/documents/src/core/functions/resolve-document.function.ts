/**
 * Stackra file contract:
 * Purpose: `resolveDocument`, a checked template filled with one set of render data: placeholders, table rows, QR
 *          codes, EAN-13 barcodes, images, signatures and amounts in words, per locale, ready for any renderer.
 * Boundary: the render data is the caller's (an order, a form submission, a market pack's currency names), read by
 *           path only. Every missing or unusable value throws `DocumentValueError` with its path (a QR or barcode
 *           value the encoder cannot take names the block's `value`); a block with no
 *           text for one of the template's locales throws `InvalidDocumentTemplateError`. Nothing is fetched.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decisions 2 and 3).
 */
import { CURRENCY_WORDS_SCHEMA } from "#core/constants/currency-words-schema.constant";
import { DocumentValueError } from "#core/errors/document-value.error";
import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
import { encodeEan13 } from "#core/functions/encode-ean13.function";
import { encodeQr } from "#core/functions/encode-qr.function";
import { fillPlaceholders } from "#core/functions/fill-placeholders.function";
import { formatValue } from "#core/functions/format-value.function";
import { readPath } from "#core/functions/read-path.function";
import { spellAmount } from "#core/functions/spell-amount.function";
import type { ImageAsset } from "#core/types/image-asset.type";
import type { ParsedDocumentTemplate } from "#core/types/parsed-document-template.type";
import type { QrMatrix } from "#core/types/qr-matrix.type";
import type { ResolvedBlock } from "#core/types/resolved-block.type";
import type { ResolvedDocument } from "#core/types/resolved-document.type";

/** The text of `localized` for `code`, or a refusal naming the template path. */
function textFor(localized: Readonly<Record<string, string>>, code: string, path: string): string {
  const text = localized[code];
  if (text === undefined)
    throw InvalidDocumentTemplateError.create({
      path: `${path}.${code}`,
      problem: "no text for this locale",
    });
  return text;
}

/** The image at `path`, checked: PNG or JPEG bytes. */
function imageAt(data: unknown, path: string): ImageAsset {
  const value = readPath(data, path);
  if (value === undefined || value === null)
    throw DocumentValueError.create({ path, reason: "missing" });
  const candidate = value as Partial<ImageAsset>;
  const isImage =
    (candidate.mediaType === "image/png" || candidate.mediaType === "image/jpeg") &&
    candidate.bytes instanceof Uint8Array;
  if (!isImage) throw DocumentValueError.create({ path, reason: "invalid" });
  return { mediaType: candidate.mediaType, bytes: candidate.bytes } as ImageAsset;
}

/** The non-negative integer amount of minor units at `path`. */
function amountAt(data: unknown, path: string): bigint {
  const value = readPath(data, path);
  if (value === undefined || value === null)
    throw DocumentValueError.create({ path, reason: "missing" });
  let amount: bigint | undefined;
  if (typeof value === "bigint") amount = value;
  else if (typeof value === "number" && Number.isSafeInteger(value)) amount = BigInt(value);
  else if (typeof value === "string" && /^\d+$/u.test(value)) amount = BigInt(value);
  if (amount === undefined || amount < 0n)
    throw DocumentValueError.create({ path, reason: "invalid" });
  return amount;
}

/**
 * `template` filled with `data`.
 *
 * @throws DocumentValueError when a value the template needs is missing or unusable.
 * @throws InvalidDocumentTemplateError when a block has no text for one of the template's locales.
 * @throws AmountWordsUnavailableError when an amount cannot be spelled in one of the locales.
 *
 * @example
 * const resolved = resolveDocument(parseDocumentTemplate(template), { order, currency: pack.currency.words });
 */
export function resolveDocument(
  template: ParsedDocumentTemplate,
  data: Readonly<Record<string, unknown>>,
): ResolvedDocument {
  const { locales } = template;
  const primary = locales[0]?.code ?? "";
  const blocks = template.blocks.map((block, index): ResolvedBlock => {
    const at = `blocks.${index}`;
    switch (block.type) {
      case "text":
        return {
          type: "text",
          role: block.role,
          align: block.align,
          texts: locales.map(({ code }) =>
            fillPlaceholders(textFor(block.text, code, `${at}.text`), data, code),
          ),
        };
      case "table": {
        const rows = readPath(data, block.rows);
        if (rows === undefined || rows === null)
          throw DocumentValueError.create({ path: block.rows, reason: "missing" });
        if (!Array.isArray(rows))
          throw DocumentValueError.create({ path: block.rows, reason: "invalid" });
        return {
          type: "table",
          columns: block.columns.map((column, columnIndex) => ({
            headers: locales.map(({ code }) =>
              textFor(column.header, code, `${at}.columns.${columnIndex}.header`),
            ),
            align: column.align,
          })),
          rows: rows.map((row: unknown, rowIndex) =>
            block.columns.map((column) => {
              const path = `${block.rows}.${rowIndex}.${column.value}`;
              const value = readPath(row, column.value);
              if (value === undefined || value === null)
                throw DocumentValueError.create({ path, reason: "missing" });
              const text = formatValue(value, primary);
              if (text === undefined) throw DocumentValueError.create({ path, reason: "invalid" });
              return text;
            }),
          ),
        };
      }
      case "qr": {
        const text = fillPlaceholders(block.value, data, primary)
          .map((part) => part.text)
          .join("");
        let matrix: QrMatrix;
        try {
          // uqr throws a bare error on a lone surrogate or on more data than a QR code holds.
          matrix = encodeQr(text, block.errorCorrection);
        } catch {
          throw DocumentValueError.create({ path: `${at}.value`, reason: "invalid" });
        }
        return { type: "qr", matrix, sizeMm: block.sizeMm, align: block.align };
      }
      case "barcode": {
        const text = fillPlaceholders(block.value, data, primary)
          .map((part) => part.text)
          .join("");
        const symbol = encodeEan13(text);
        if (symbol === undefined)
          throw DocumentValueError.create({ path: `${at}.value`, reason: "invalid" });
        return {
          type: "barcode",
          modules: symbol.modules,
          text: symbol.text,
          showText: block.showText,
          widthMm: block.widthMm,
          heightMm: block.heightMm,
          align: block.align,
        };
      }
      case "image":
        return {
          type: "image",
          image: imageAt(data, block.image),
          widthMm: block.widthMm,
          heightMm: block.heightMm,
          align: block.align,
        };
      case "signature":
        return {
          type: "signature",
          image: imageAt(data, block.image),
          labels: locales.map(({ code }) => textFor(block.label, code, `${at}.label`)),
          widthMm: block.widthMm,
          heightMm: block.heightMm,
          align: block.align,
        };
      case "amount-in-words": {
        const amount = amountAt(data, block.amount);
        const words = readPath(data, block.currency);
        if (words === undefined || words === null)
          throw DocumentValueError.create({ path: block.currency, reason: "missing" });
        const currency = CURRENCY_WORDS_SCHEMA.safeParse(words);
        if (!currency.success)
          throw DocumentValueError.create({ path: block.currency, reason: "invalid" });
        return {
          type: "amount-in-words",
          align: block.align,
          texts: locales.map(({ code }) =>
            [
              block.prefix === undefined ? undefined : textFor(block.prefix, code, `${at}.prefix`),
              spellAmount(amount, currency.data, new Intl.Locale(code).language),
              block.suffix === undefined ? undefined : textFor(block.suffix, code, `${at}.suffix`),
            ]
              .filter((part) => part !== undefined && part !== "")
              .join(" "),
          ),
        };
      }
      default:
        block satisfies never;
        throw new TypeError(`${at}: unknown block type`);
    }
  });
  return { template, blocks };
}
