/**
 * Stackra file contract:
 * Purpose: unit tests of the native `SavedViewTabs`: the all-rows tab comes first and is selected, then one tab per view by
 *          name, and each tab draws the list under its own view.
 * Boundary: unit tier, jsdom; the kit's `Tabs` is a DOM stand-in that draws every tab's content.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decisions 1 and 7).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import type { SavedView } from "#core/schemas/saved-view.schema";
import { SavedViewTabs } from "#native/saved-view-tabs/saved-view-tabs";

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  return {
    Tabs: (props: {
      readonly label: string;
      readonly defaultSelectedKeys: readonly string[];
      readonly items: readonly { id: string; label: string; content: ReactNode }[];
    }) =>
      createElement(
        "section",
        { "aria-label": props.label, "data-selected": props.defaultSelectedKeys.join(",") },
        props.items.map((item) =>
          createElement("div", { key: item.id, title: item.label }, item.content),
        ),
      ),
  };
});

afterEach(cleanup);

const views = [{ id: "view_1", name: "Open" }] as SavedView[];

describe("SavedViewTabs", () => {
  it("draws the all-rows tab first, then each view under its own state", () => {
    render(
      <SavedViewTabs
        label="Saved views"
        allLabel="All"
        views={views}
        render={(view) => <p>{view?.id ?? "none"}</p>}
      />,
    );
    const tabs = screen.getByLabelText("Saved views");
    expect(tabs.getAttribute("data-selected")).toBe("all");
    expect(screen.getByTitle("All").textContent).toBe("none");
    expect(screen.getByTitle("Open").textContent).toBe("view_1");
  });
});
