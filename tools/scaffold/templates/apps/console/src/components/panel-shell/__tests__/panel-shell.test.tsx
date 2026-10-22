/**
 * Stackra file contract:
 * Purpose: renders the route table in a memory router and proves the panel shell wraps the index page.
 * Owner: the app owner · Secrets: forbidden
 */
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { routes } from "#src/routes";

describe("PanelShell", () => {
  it("renders the panel title around the index page", () => {
    render(<RouterProvider router={createMemoryRouter(routes)} />);
    expect(screen.getByRole("heading", { name: "{{TITLE}}" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Resources" })).toBeTruthy();
    expect(screen.getByText("No resources registered yet.")).toBeTruthy();
  });
});
