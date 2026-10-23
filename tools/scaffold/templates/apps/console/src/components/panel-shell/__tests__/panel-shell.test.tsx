/**
 * Stackra file contract:
 * Purpose: renders the panel shell as the layout of a memory router and proves it wraps the child page.
 * Boundary: a memory router in jsdom; no network.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14); ADR 0022 (test placement).
 */
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { PanelShell } from "#src/components/panel-shell";

describe("PanelShell", () => {
  it("renders the panel title and navigation around the child page", () => {
    const router = createMemoryRouter([
      {
        element: <PanelShell title="{{TITLE}}" />,
        children: [{ path: "/", element: <p>Child page</p> }],
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(screen.getByRole("heading", { name: "{{TITLE}}" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Resources" })).toBeTruthy();
    expect(screen.getByText("Child page")).toBeTruthy();
  });
});
