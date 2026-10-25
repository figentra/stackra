// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the web `DocumentRenderer`: it renders through the container's `Renderer` with the document,
 *          the active locale and the page's handlers, and draws what the renderer returns.
 * Boundary: test only, jsdom. The container and the locale are stand-ins; the renderer records what it was given.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decision 6); ADR 0263.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { vi } from "vitest";

import type { RenderContext } from "#contracts/types/render-context.type";
import { DocumentRenderer } from "#react/document-renderer/document-renderer";

/** What the stand-in renderer was given. */
const calls = vi.hoisted(() => [] as { document: unknown; context: RenderContext }[]);

vi.mock("@stackra/container/react", () => ({
  useContainer: () => ({
    get: () => ({
      render: (document: unknown, context: RenderContext) => {
        calls.push({ document, context });
        return createElement("p", null, "drawn");
      },
    }),
  }),
}));

vi.mock("@stackra/i18n/react", () => ({ useLocale: () => ({ locale: "ar" }) }));

afterEach(() => {
  cleanup();
  calls.length = 0;
});

describe("DocumentRenderer", () => {
  it("renders the document through the container's Renderer in the active locale", () => {
    const onNavigate = vi.fn();
    const document = { block: "web.hero_section" };
    render(<DocumentRenderer document={document} onNavigate={onNavigate} />);
    expect(screen.getByText("drawn")).toBeTruthy();
    expect(calls).toEqual([{ document, context: { locale: "ar", onNavigate } }]);
  });
});
