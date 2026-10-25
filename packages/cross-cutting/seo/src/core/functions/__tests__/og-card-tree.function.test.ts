/**
 * Stackra file contract:
 * Purpose: unit tests of `ogCardTree`: the site's accent colours on the root, the default colours for a missing or
 *          non-hex colour, the logo as a base64 SVG data URL, the picture beside the text only for `https:`, the
 *          mirrored rows of a right-to-left site, and a long title cut with an ellipsis.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0301 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import type { OgCard } from "#contracts/types/og-card.type";
import { ogCardTree } from "#core/functions/og-card-tree.function";

/** A site card. */
const CARD: OgCard = {
  template: "site",
  width: 1200,
  height: 630,
  title: "Mugs for every desk",
  siteName: "Acme",
  dir: "ltr",
  brand: { accent: { hexLight: "#D9462B" }, "accent-foreground": { hexLight: "#FFFFFF" } },
  logo: '<svg xmlns="http://www.w3.org/2000/svg"/>',
};

/** Every node of a tree, depth first. */
function nodes(tree: unknown): { type: string; props: Record<string, unknown> }[] {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (tree === null || typeof tree !== "object") return [];
  const node = tree as { type: string; props: Record<string, unknown> };
  return [node, ...nodes(node.props["children"])];
}

/** The style of the root. */
const rootStyle = (card: OgCard) => ogCardTree(card).props["style"] as Record<string, unknown>;

describe("ogCardTree", () => {
  it("paints the site's accent colours", () => {
    expect(rootStyle(CARD)).toMatchObject({
      backgroundColor: "#D9462B",
      color: "#FFFFFF",
      flexDirection: "row",
    });
  });

  it("falls back to the default colours for a missing or non-hex colour", () => {
    const style = rootStyle({ ...CARD, brand: { accent: { hexLight: "oklch(60% 0.2 30)" } } });
    expect(style).toMatchObject({ backgroundColor: "#111827", color: "#FFFFFF" });
  });

  it("embeds the logo as a base64 SVG data URL", () => {
    const logo = nodes(ogCardTree(CARD)).find((node) => node.type === "img");
    const src = String(logo?.props["src"]);
    expect(src.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(atob(src.slice("data:image/svg+xml;base64,".length))).toBe(CARD.logo);
  });

  it("leaves out an empty logo", () => {
    expect(nodes(ogCardTree({ ...CARD, logo: "" })).some((node) => node.type === "img")).toBe(
      false,
    );
  });

  it("shows an https picture beside the text and drops any other", () => {
    const withPicture = nodes(
      ogCardTree({ ...CARD, template: "product", image: "https://cdn.acme.test/mug.jpg" }),
    );
    expect(withPicture.some((node) => node.props["src"] === "https://cdn.acme.test/mug.jpg")).toBe(
      true,
    );
    const insecure = nodes(ogCardTree({ ...CARD, image: "http://cdn.acme.test/mug.jpg" }));
    expect(insecure.some((node) => node.props["src"] === "http://cdn.acme.test/mug.jpg")).toBe(
      false,
    );
  });

  it("mirrors the rows of a right-to-left site", () => {
    expect(rootStyle({ ...CARD, dir: "rtl" })).toMatchObject({ flexDirection: "row-reverse" });
  });

  it("cuts a title above 200 characters", () => {
    const texts = nodes(ogCardTree({ ...CARD, title: "a".repeat(300) })).map(
      (node) => node.props["children"],
    );
    const title = texts.find((child) => typeof child === "string" && child.startsWith("aaa"));
    expect(title).toHaveLength(200);
    expect(String(title).endsWith("…")).toBe(true);
  });
});
