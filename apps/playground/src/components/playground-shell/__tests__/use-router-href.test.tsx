/**
 * Stackra file contract:
 * Purpose: proves `useRouterHref` resolves an app path through React Router and leaves an absolute URL as it is.
 * Boundary: a memory router in jsdom; no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { useRouterHref } from "../use-router-href";

function Probe({ href }: { readonly href: string }) {
  return <output>{useRouterHref(href)}</output>;
}

describe("useRouterHref", () => {
  it.each([
    ["https://www.heroui.com/docs", "https://www.heroui.com/docs"],
    ["mailto:team@figentra.com", "mailto:team@figentra.com"],
    ["/button", "/button"],
    ["button#usage", "/password-field/button#usage"],
  ])("resolves %s to %s", (href, expected) => {
    const router = createMemoryRouter(
      [{ path: "/password-field", element: <Probe href={href} /> }],
      {
        initialEntries: ["/password-field"],
      },
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole("status").textContent).toBe(expected);
  });
});
