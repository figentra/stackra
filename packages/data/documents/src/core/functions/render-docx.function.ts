/**
 * Stackra file contract:
 * Purpose: `renderDocx`, a resolved document as a Word file: the template's page and margins, right-to-left
 *          paragraphs and runs for right-to-left locales (Word shapes and reorders them), the bilingual layout as a
 *          borderless two-column table or stacked paragraphs, tables, QR codes and EAN-13 barcodes as PNG, struck
 *          text and inline images.
 * Boundary: a DOCX page needs a height, so a roll template (no `heightMm`) throws `InvalidDocumentTemplateError`.
 *           Writing is `docx`'s; the output goes through base64 so it runs wherever `docx` runs, Node or browser.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableBorders,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
import { bytesOfBase64 } from "#core/functions/bytes-of-base64.function";
import { encodeQrPng } from "#core/functions/encode-qr-png.function";
import type { ImageAsset } from "#core/types/image-asset.type";
import type { ResolvedDocument } from "#core/types/resolved-document.type";
import type { TextPart } from "#core/types/text-part.type";

/** Twentieths of a point in a millimetre. */
const TWIPS_PER_MM = 1440 / 25.4;

/** CSS pixels in a millimetre; `docx` sizes images in pixels at 96 per inch. */
const PIXELS_PER_MM = 96 / 25.4;

/** Pixels per QR or barcode module in the embedded PNG; enough to stay sharp at print sizes. */
const QR_SCALE = 8;

/** The logical alignment as Word's. */
const ALIGNMENTS = {
  start: AlignmentType.START,
  center: AlignmentType.CENTER,
  end: AlignmentType.END,
} as const;

/** One locale's look: direction and font. */
interface Look {
  readonly isRtl: boolean;
  readonly font?: string;
}

/** A paragraph of `parts` in `look`. */
function paragraphOf(
  parts: readonly TextPart[],
  look: Look,
  align: keyof typeof ALIGNMENTS,
  role: "title" | "heading" | "body" | "note" | "struck",
): Paragraph {
  return new Paragraph({
    bidirectional: look.isRtl,
    alignment: ALIGNMENTS[align],
    ...(role === "title"
      ? { heading: HeadingLevel.TITLE }
      : role === "heading"
        ? { heading: HeadingLevel.HEADING_1 }
        : {}),
    children: parts.map(
      (part) =>
        new TextRun({
          text: part.text,
          rightToLeft: look.isRtl,
          ...(look.font === undefined ? {} : { font: look.font }),
          ...(role === "note" ? { size: 16 } : {}),
          ...(role === "struck" ? { strike: true } : {}),
        }),
    ),
  });
}

/** An image paragraph. */
function imageParagraph(
  data: Uint8Array,
  type: "png" | "jpg",
  widthMm: number,
  heightMm: number,
  align: keyof typeof ALIGNMENTS,
): Paragraph {
  return new Paragraph({
    alignment: ALIGNMENTS[align],
    children: [
      new ImageRun({
        type,
        data,
        transformation: {
          width: Math.round(widthMm * PIXELS_PER_MM),
          height: Math.round(heightMm * PIXELS_PER_MM),
        },
      }),
    ],
  });
}

/** The `docx` type of an image. */
function typeOf(image: ImageAsset): "png" | "jpg" {
  return image.mediaType === "image/png" ? "png" : "jpg";
}

/**
 * The DOCX bytes of `document`.
 *
 * @throws InvalidDocumentTemplateError when the template is a roll (no page height).
 *
 * @example
 * const docx = await renderDocx(resolveDocument(template, data));
 */
export async function renderDocx(document: ResolvedDocument): Promise<Uint8Array> {
  const { template } = document;
  const { page } = template;
  if (page.heightMm === undefined)
    throw InvalidDocumentTemplateError.create({
      path: "page.heightMm",
      problem: "a DOCX page needs a height",
    });
  const looks: readonly Look[] = template.locales.map((locale) => ({
    isRtl: locale.direction === "rtl",
    ...(locale.font === undefined ? {} : { font: locale.font }),
  }));
  const primary = looks[0] ?? { isRtl: false };
  const localized = (paragraphs: readonly Paragraph[]): (Paragraph | Table)[] =>
    template.layout === "side-by-side"
      ? [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TableBorders.NONE,
            visuallyRightToLeft: primary.isRtl,
            rows: [
              new TableRow({
                children: paragraphs.map((paragraph) => new TableCell({ children: [paragraph] })),
              }),
            ],
          }),
        ]
      : [...paragraphs];
  const children: (Paragraph | Table)[] = [];
  for (const block of document.blocks) {
    switch (block.type) {
      case "text":
        children.push(
          ...localized(
            block.texts.map((parts, index) =>
              paragraphOf(parts, looks[index] ?? primary, block.align, block.role),
            ),
          ),
        );
        break;
      case "amount-in-words":
        children.push(
          ...localized(
            block.texts.map((text, index) =>
              paragraphOf([{ text, isValue: false }], looks[index] ?? primary, block.align, "body"),
            ),
          ),
        );
        break;
      case "table": {
        const cell = (text: string, align: keyof typeof ALIGNMENTS, look: Look): TableCell =>
          new TableCell({
            children: [paragraphOf([{ text, isValue: false }], look, align, "body")],
          });
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: primary.isRtl,
            rows: [
              new TableRow({
                tableHeader: true,
                children: block.columns.map(
                  (column) =>
                    new TableCell({
                      children: column.headers.map((header, index) =>
                        paragraphOf(
                          [{ text: header, isValue: false }],
                          looks[index] ?? primary,
                          column.align,
                          "body",
                        ),
                      ),
                    }),
                ),
              }),
              ...block.rows.map(
                (row) =>
                  new TableRow({
                    children: row.map((text, index) =>
                      cell(text, block.columns[index]?.align ?? "start", primary),
                    ),
                  }),
              ),
            ],
          }),
        );
        break;
      }
      case "qr":
        children.push(
          imageParagraph(
            await encodeQrPng(block.matrix, QR_SCALE),
            "png",
            block.sizeMm,
            block.sizeMm,
            block.align,
          ),
        );
        break;
      case "barcode":
        children.push(
          imageParagraph(
            await encodeQrPng([block.modules], QR_SCALE),
            "png",
            block.widthMm,
            block.heightMm,
            block.align,
          ),
          ...(block.showText
            ? [
                paragraphOf(
                  [{ text: block.text, isValue: false }],
                  { isRtl: false },
                  block.align,
                  "body",
                ),
              ]
            : []),
        );
        break;
      case "image":
        children.push(
          imageParagraph(
            block.image.bytes,
            typeOf(block.image),
            block.widthMm,
            block.heightMm,
            block.align,
          ),
        );
        break;
      case "signature":
        children.push(
          imageParagraph(
            block.image.bytes,
            typeOf(block.image),
            block.widthMm,
            block.heightMm,
            block.align,
          ),
          ...localized(
            block.labels.map((label, index) =>
              paragraphOf(
                [{ text: label, isValue: false }],
                looks[index] ?? primary,
                block.align,
                "body",
              ),
            ),
          ),
        );
        break;
    }
  }
  const margin = Math.round(page.marginMm * TWIPS_PER_MM);
  const file = new Document({
    title: template.name,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: Math.round(page.widthMm * TWIPS_PER_MM),
              height: Math.round(page.heightMm * TWIPS_PER_MM),
            },
            margin: { top: margin, right: margin, bottom: margin, left: margin },
          },
        },
        children,
      },
    ],
  });
  return bytesOfBase64(await Packer.toBase64String(file));
}
