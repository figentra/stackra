/**
 * Stackra file contract:
 * Purpose: unit tests of the web `SavedViewTabs`: it draws `@stackra/ui`'s `SavedViews` as tabs over the
 *          engine it is given, under its spoken name.
 * Boundary: unit tier, jsdom; the kit's `SavedViews` is a DOM stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decision 7); ADR 0505.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import type { CollectionController } from "@stackra/ui/contracts";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { SavedViewTabs } from "#react/saved-view-tabs/saved-view-tabs";

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  return {
    SavedViews: (props: {
      readonly label: string;
      readonly variant: string;
      readonly collection: { readonly views: readonly { id: string; label: string }[] };
    }) =>
      createElement(
        "section",
        { "aria-label": props.label, "data-variant": props.variant },
        props.collection.views.map((view) => createElement("span", { key: view.id }, view.label)),
      ),
  };
});

afterEach(cleanup);

describe("SavedViewTabs", () => {
  it("draws the engine's views as tabs", () => {
    const collection = {
      views: [
        { id: "all", label: "All", state: {} },
        { id: "view_1", label: "Open", state: {} },
      ],
    } as unknown as CollectionController;
    render(<SavedViewTabs collection={collection} label="Saved views" />);
    expect(screen.getByLabelText("Saved views").getAttribute("data-variant")).toBe("tabs");
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Open")).toBeTruthy();
  });
});
