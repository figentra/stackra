/**
 * Stackra file contract:
 * Purpose: proves the native Highlight nests the matches inside one Text and keeps the text unchanged.
 * Boundary: Text is a stand-in span.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { Highlight } from "#native/highlight/highlight";

vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);

describe("Highlight (native)", () => {
  it("nests the match in one text", () => {
    const { container } = render(<Highlight query="jeddah">Jeddah Corniche</Highlight>);
    expect(container.textContent).toBe("Jeddah Corniche");
    expect(container.querySelector("span > span")?.textContent).toBe("Jeddah");
  });
});
