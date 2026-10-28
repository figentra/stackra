/**
 * Stackra file contract:
 * Purpose: `renderHtml`, a resolved document as one self-contained HTML page with print CSS: the page size and margin
 *          of the template, `dir` and `lang` on every localized element, values isolated in `<bdi>`, the bilingual
 *          layout (side by side or stacked), QR codes and EAN-13 barcodes as inline SVG, struck text as `<s>` and
 *          images as `data:` URLs.
 * Boundary: pure: no fetch, no script, no external stylesheet; every text is escaped. Shaping and reordering are left
 *           to the engine that displays or prints the page (`PdfEngine`). Fonts are family names from the template
 *           (the brand kit), with the generic `sans-serif` after them.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */
import { escapeHtml } from "@stackra/support";

import { base64Of } from "#core/functions/base64-of.function";
import type { ImageAsset } from "#core/types/image-asset.type";
import type { QrMatrix } from "#core/types/qr-matrix.type";
import type { ResolvedDocument } from "#core/types/resolved-document.type";
import type { TextPart } from "#core/types/text-part.type";

/** The HTML element of each text role. */
const ROLE_TAGS = { title: "h1", heading: "h2", body: "p", note: "small", struck: "s" } as const;

/** The page's style sheet. */
function styleOf(document: ResolvedDocument): string {
  const { page, locales } = document.template;
  const height = page.heightMm === undefined ? "auto" : `${page.heightMm}mm`;
  const fonts = locales
    .filter((locale) => locale.font !== undefined)
    .map((locale) => `[lang="${escapeHtml(locale.code)}"]{font-family:"${locale.font}",sans-serif}`)
    .join("");
  return [
    `@page{size:${page.widthMm}mm ${height};margin:${page.marginMm}mm}`,
    "*{box-sizing:border-box}",
    "body{margin:0;font-family:sans-serif;font-size:10pt;color:#000;background:#fff}",
    "h1,h2,p,small,s,figure{display:block;margin:0 0 2mm}",
    "h1{font-size:1.6em}h2{font-size:1.2em}small{font-size:.8em}",
    ".start{text-align:start}.center{text-align:center}.end{text-align:end}",
    ".pair{display:grid;grid-template-columns:1fr 1fr;gap:4mm}",
    "table{width:100%;border-collapse:collapse;margin:0 0 2mm}",
    "th,td{border-bottom:.2mm solid #000;padding:1mm}",
    fonts,
  ].join("");
}

/** `parts` as HTML, each value in `<bdi>`. */
function partsHtml(parts: readonly TextPart[]): string {
  return parts
    .map((part) => (part.isValue ? `<bdi>${escapeHtml(part.text)}</bdi>` : escapeHtml(part.text)))
    .join("");
}

/** One element per locale, laid out as the template asks. */
function localized(
  document: ResolvedDocument,
  tag: string,
  align: string,
  contents: readonly string[],
): string {
  const { locales, layout } = document.template;
  const elements = contents.map((content, index) => {
    const locale = locales[index];
    return `<${tag} class="${align}" dir="${locale?.direction ?? "auto"}" lang="${escapeHtml(locale?.code ?? "")}">${content}</${tag}>`;
  });
  return layout === "side-by-side"
    ? `<div class="pair">${elements.join("")}</div>`
    : elements.join("");
}

/** A QR matrix as an SVG path, one unit per module. */
function qrSvg(matrix: QrMatrix, sizeMm: number): string {
  let path = "";
  matrix.forEach((row, y) =>
    row.forEach((isDark, x) => {
      if (isDark) path += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${matrix.length} ${matrix.length}" width="${sizeMm}mm" height="${sizeMm}mm" shape-rendering="crispEdges"><path fill="#000" d="${path}"/></svg>`;
}

/** Barcode bars as an SVG stretched to `widthMm` by `heightMm`, one unit per module. */
function barcodeSvg(modules: readonly boolean[], widthMm: number, heightMm: number): string {
  let path = "";
  modules.forEach((isDark, x) => {
    if (isDark) path += `M${x} 0h1v1h-1z`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${modules.length} 1" width="${widthMm}mm" height="${heightMm}mm" preserveAspectRatio="none" shape-rendering="crispEdges"><path fill="#000" d="${path}"/></svg>`;
}

/** An inline image. */
function imageHtml(image: ImageAsset, widthMm: number, heightMm: number, alt: string): string {
  return `<img src="data:${image.mediaType};base64,${base64Of(image.bytes)}" style="width:${widthMm}mm;height:${heightMm}mm" alt="${escapeHtml(alt)}">`;
}

/**
 * The HTML page of `document`.
 *
 * @example
 * const html = renderHtml(resolveDocument(template, data));
 */
export function renderHtml(document: ResolvedDocument): string {
  const { template } = document;
  const primary = template.locales[0];
  const body = document.blocks
    .map((block) => {
      switch (block.type) {
        case "text":
          return localized(
            document,
            ROLE_TAGS[block.role],
            block.align,
            block.texts.map(partsHtml),
          );
        case "amount-in-words":
          return localized(document, "p", block.align, block.texts.map(escapeHtml));
        case "table": {
          const head = block.columns
            .map(
              (column) =>
                `<th class="${column.align}">${column.headers.map(escapeHtml).join("<br>")}</th>`,
            )
            .join("");
          const rows = block.rows
            .map(
              (row) =>
                `<tr>${row.map((cell, index) => `<td class="${block.columns[index]?.align ?? "start"}">${escapeHtml(cell)}</td>`).join("")}</tr>`,
            )
            .join("");
          return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
        }
        case "qr":
          return `<figure class="${block.align}">${qrSvg(block.matrix, block.sizeMm)}</figure>`;
        case "barcode":
          return `<figure class="${block.align}">${barcodeSvg(block.modules, block.widthMm, block.heightMm)}${block.showText ? `<p dir="ltr">${escapeHtml(block.text)}</p>` : ""}</figure>`;
        case "image":
          return `<figure class="${block.align}">${imageHtml(block.image, block.widthMm, block.heightMm, "")}</figure>`;
        case "signature":
          return `<figure class="${block.align}">${imageHtml(block.image, block.widthMm, block.heightMm, block.labels[0] ?? "")}${localized(document, "p", block.align, block.labels.map(escapeHtml))}</figure>`;
        default:
          block satisfies never;
          throw new TypeError("renderHtml: unknown block type");
      }
    })
    .join("");
  return `<!doctype html><html lang="${escapeHtml(primary?.code ?? "")}" dir="${primary?.direction ?? "ltr"}"><head><meta charset="utf-8"><title>${escapeHtml(template.name)}</title><style>${styleOf(document)}</style></head><body>${body}</body></html>`;
}
