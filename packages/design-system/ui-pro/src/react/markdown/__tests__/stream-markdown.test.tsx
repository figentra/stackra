/**
 * Stackra file contract:
 * Purpose: proves the web StreamMarkdown renders Markdown that is still arriving, passes `isStreaming` and unknown
 *          props through, and keeps rendering when the text grows.
 * Boundary: jsdom with real HeroUI Pro and real `streamdown`; the theme CSS is not loaded, so classes are checked,
 *          not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { render, screen, waitFor } from "@testing-library/react";

import { StreamMarkdown } from "#react/markdown/stream-markdown";

describe("StreamMarkdown (web)", () => {
  it("renders Markdown and passes unknown props through", async () => {
    render(
      <StreamMarkdown className="extra" data-testid="doc">
        {"# Title\n\nSome **bold** text."}
      </StreamMarkdown>,
    );
    const doc = screen.getByTestId("doc");
    expect(doc.classList.contains("extra")).toBe(true);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Title" })).toBeTruthy());
    expect(doc.textContent).toContain("bold");
  });

  it("keeps rendering while the text grows and streaming ends", async () => {
    const { container, rerender } = render(<StreamMarkdown isStreaming>{"Hello"}</StreamMarkdown>);
    await waitFor(() => expect(container.textContent).toContain("Hello"));
    rerender(<StreamMarkdown isStreaming>{"Hello world"}</StreamMarkdown>);
    await waitFor(() => expect(container.textContent).toContain("Hello world"));
    rerender(<StreamMarkdown>{"Hello world."}</StreamMarkdown>);
    await waitFor(() => expect(container.textContent).toContain("Hello world."));
  });
});
