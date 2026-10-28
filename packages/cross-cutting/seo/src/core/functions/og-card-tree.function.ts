/**
 * Stackra file contract:
 * Purpose: `ogCardTree`, the layout of one Open Graph card as the element tree the layout engine reads: the site's
 *          accent colour as the background, the logo and site name on top, the title in bold below, and on a card
 *          with a picture (a product) the picture beside the text. Right-to-left sites mirror the rows.
 * Boundary: internal and pure: plain `{ type, props }` objects, no React. Tenant input is checked here: a colour that
 *           is not `#RRGGBB(AA)` hex falls back to the default, a picture that is not `https:` is left out, and a title
 *           longer than 200 characters is cut with an ellipsis. Text is set as text, never parsed as markup.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 7); ADR 0302 (colour roles).
 */
import type { OgCard } from "#contracts/types/og-card.type";

/** One node of the card's element tree. */
type OgNode = { type: string; props: Record<string, unknown> };

/** A colour the layout engine reads. */
const HEX = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** The background and text colours when the site sets none. */
const DEFAULT_COLOURS = Object.freeze({ background: "#111827", text: "#FFFFFF" });

/** The longest title a card shows. */
const MAX_TITLE = 200;

/** The site's colour for `role`, or `fallback`. */
function colour(card: OgCard, role: string, fallback: string): string {
  const hex = card.brand[role]?.hexLight;
  return hex !== undefined && HEX.test(hex) ? hex : fallback;
}

/** SVG markup as a base64 data URL. */
function svgDataUrl(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  let binary = "";
  for (const byte of bytes) binary += String.fromCodePoint(byte);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

/** An element. */
function node(
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra?: object,
): OgNode {
  return { type, props: { style, ...(children === undefined ? {} : { children }), ...extra } };
}

/**
 * The element tree of `card`.
 *
 * @example
 * await satori(ogCardTree(card), { width: card.width, height: card.height, fonts });
 */
export function ogCardTree(card: OgCard): OgNode {
  const rtl = card.dir === "rtl";
  const row = rtl ? "row-reverse" : "row";
  const align = rtl ? "right" : "left";
  const title =
    card.title.length > MAX_TITLE ? `${card.title.slice(0, MAX_TITLE - 1)}…` : card.title;
  const picture =
    card.image !== undefined && card.image.startsWith("https://") ? card.image : undefined;
  const pad = Math.round(Math.min(card.width, card.height) * 0.1);

  const header = node(
    "div",
    { display: "flex", flexDirection: row, alignItems: "center", gap: 24 },
    [
      ...(card.logo === ""
        ? []
        : [
            node("img", { width: 64, height: 64, objectFit: "contain" }, undefined, {
              src: svgDataUrl(card.logo),
              width: 64,
              height: 64,
            }),
          ]),
      node("div", { fontSize: 36, fontWeight: 400 }, card.siteName),
    ],
  );
  const headline = node(
    "div",
    {
      display: "block",
      fontSize: title.length > 60 ? 52 : 64,
      fontWeight: 700,
      lineClamp: 3,
      textAlign: align,
    },
    title,
  );
  const text = node(
    "div",
    { display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, gap: 32 },
    [header, headline],
  );
  const side = Math.round(card.height - pad * 2);
  const children = picture
    ? [
        text,
        node(
          "img",
          { width: side, height: side, objectFit: "cover", borderRadius: 24 },
          undefined,
          {
            src: picture,
            width: side,
            height: side,
          },
        ),
      ]
    : [text];

  return node(
    "div",
    {
      display: "flex",
      flexDirection: row,
      gap: 48,
      width: "100%",
      height: "100%",
      padding: pad,
      backgroundColor: colour(card, "accent", DEFAULT_COLOURS.background),
      color: colour(card, "accent-foreground", DEFAULT_COLOURS.text),
      fontFamily: rtl ? "Noto Sans Arabic, Inter" : "Inter, Noto Sans Arabic",
    },
    children,
  );
}
