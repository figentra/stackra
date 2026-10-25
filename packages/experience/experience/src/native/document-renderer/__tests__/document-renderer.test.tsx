// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the native `DocumentRenderer`: it renders through the container's `Renderer` with the
 *          document, the active locale and the screen's `onNavigate` and `onAction`, and draws what the renderer
 *          returns.
 * Boundary: test only, jsdom. The container and the locale are stand-ins; the renderer records what it was given.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decisions 3 and 6); ADR 0263.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { vi } from "vitest";

import type { RenderContext } from "#contracts/types/render-context.type";
import { DocumentRenderer } from "#native/document-renderer/document-renderer";

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

vi.mock("@stackra/i18n/react", () => ({ useLocale: () => ({ locale: "en" }) }));

afterEach(() => {
  cleanup();
  calls.length = 0;
});

describe("DocumentRenderer (native)", () => {
  it("renders through the container's Renderer with the locale and the screen's handlers", () => {
    const onNavigate = vi.fn();
    const onAction = vi.fn();
    const document = [{ block: "mobile.promo_banner" }];
    render(<DocumentRenderer document={document} onNavigate={onNavigate} onAction={onAction} />);
    expect(screen.getByText("drawn")).toBeTruthy();
    expect(calls).toEqual([{ document, context: { locale: "en", onNavigate, onAction } }]);
  });
});
