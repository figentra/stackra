/**
 * Stackra file contract:
 * Purpose: proves the PromptInput page sits at /pro-prompt-input in the Pro category, titles the page and the document, and draws a composer with named controls that sends into a list, and one that is waiting for a reply.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen, fireEvent } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProPromptInput } from "#src/routes/pro-prompt-input/pro-prompt-input";
import { ProPromptInputRoute } from "#src/routes/pro-prompt-input/pro-prompt-input.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProPromptInput", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-prompt-input in the Pro category, and titles the page and the document", () => {
    render(<ProPromptInput />);
    expect(routePath(ProPromptInputRoute)).toBe("/pro-prompt-input");
    expect(ProPromptInputRoute.category).toBe("AI");
    expect(screen.getByRole("heading", { level: 1, name: ProPromptInputRoute.title })).toBeTruthy();
    expect(document.title).toBe("PromptInput · Stackra Playground");
  });

  it("names the text area and the buttons of the composer", () => {
    render(<ProPromptInput />);
    expect(screen.getByRole("textbox", { name: "Message" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Attach file" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send message" })).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["Composer", "Waiting for a reply"]);
  });

  it("sends the text into the list and empties the field", () => {
    render(<ProPromptInput />);
    const field = screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: "Hello there" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(screen.getByText("Hello there").tagName).toBe("BDI");
    expect(field.value).toBe("");
  });

  it("offers to stop the reply while it is on its way", () => {
    render(<ProPromptInput />);
    fireEvent.click(screen.getByRole("button", { name: "Stop the reply" }));
    expect(screen.getByText("The reply was stopped.")).toBeTruthy();
  });
});
