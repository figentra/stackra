/**
 * Stackra file contract:
 * Purpose: unit tests of `renderConstitution`: the index law first and the rest by name, each a `## <title>` section
 *          with its headings demoted; a `<Step>` becomes one list item and another docs component keeps its dedented
 *          text without its tags; a law without a title is named by its file.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0510; STA-2098 (H6); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { renderConstitution } from "#node/functions/render-constitution.function";

describe("renderConstitution", () => {
  it("renders the index first, then each law, with components reduced to their text", () => {
    const text = renderConstitution([
      {
        name: "secrets.mdx",
        text: '---\ntitle: "Secrets"\n---\n\n# Rules\n\n<Note>\n  Nobody reads a value.\n</Note>\n',
      },
      {
        name: "index.mdx",
        text: '---\ntitle: The hierarchy\n---\n\n<Steps>\n<Step title="Laws">\n  Win over\n  everything.\n</Step>\n</Steps>\n',
      },
      { name: "plain.mdx", text: "Body.\n" },
    ]);
    expect(text).toBe(
      [
        "# Stackra Constitution",
        "",
        "<!-- generated from apps/docs/src/docs/constitution/*.mdx by stackra constitution — edit the sources, not this file -->",
        "",
        "## The hierarchy",
        "",
        "- **Laws**: Win over everything.",
        "",
        "## plain.mdx",
        "",
        "Body.",
        "",
        "## Secrets",
        "",
        "## Rules",
        "",
        "Nobody reads a value.",
        "",
      ].join("\n"),
    );
  });
});
