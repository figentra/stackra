/**
 * Stackra file contract:
 * Purpose: `llmsTxt` over the real registry and English catalogue: the heading, a category section and a component link.
 * Boundary: reads the catalogue file; renders nothing.
 * Runtime: node
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { COMPONENTS } from "#src/registry/components.generated";
import { llmsTxt } from "#src/registry/llms-txt.function";

const EN = JSON.parse(
  readFileSync(new URL("../../../assets/lang/en/showcase.json", import.meta.url), "utf8"),
) as unknown;

describe("llmsTxt", () => {
  const text = llmsTxt({
    entries: COMPONENTS,
    catalogue: EN,
    baseUrl: "https://ui.example/",
    title: "Stackra UI",
    summary: "The design system.",
  });
  it("opens with the title and summary", () => {
    expect(text.startsWith("# Stackra UI\n\n> The design system.\n")).toBe(true);
  });
  it("lists categories and links components with their words", () => {
    expect(text).toContain("\n## Actions\n");
    expect(text).toContain(
      "- [Button](https://ui.example/button): Triggers an action or an event. Every action starts with one clear press.",
    );
  });
});
