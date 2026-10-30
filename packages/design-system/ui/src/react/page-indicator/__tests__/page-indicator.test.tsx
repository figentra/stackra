/**
 * Stackra file contract:
 * Purpose: proves the web PageIndicator is one image named "Page 2 of 5" when display only, and with `onChange` a
 *          named group of buttons, the current one `aria-current`, each going to its page; names can be replaced.
 * Boundary: jsdom.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { PageIndicator } from "#react/page-indicator/page-indicator";

describe("PageIndicator (web)", () => {
  it("is one image when display only", () => {
    render(<PageIndicator count={5} index={1} />);
    expect(screen.getByRole("img", { name: "Page 2 of 5" })).toBeTruthy();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("is a group of buttons with onChange", () => {
    const onChange = vi.fn();
    render(<PageIndicator count={3} index={0} onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Page 1 of 3" }).getAttribute("aria-current")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Page 3 of 3" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("takes its own names", () => {
    render(
      <PageIndicator
        count={2}
        index={0}
        onChange={() => undefined}
        label="Choose a step"
        getPageLabel={(page, count) => `Step ${page} of ${count}`}
      />,
    );
    expect(screen.getByRole("group", { name: "Choose a step" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Step 2 of 2" })).toBeTruthy();
  });
});
