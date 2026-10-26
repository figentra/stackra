/**
 * Stackra file contract:
 * Purpose: unit tests of `useLayoutData`: a page below a layout route reads its data by key, a locale mount's copy
 *          (`ar-sa/site`) matches too, and an unmatched key is `undefined`.
 * Boundary: test only; jsdom with a memory data router whose layout route has a plain loader.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0294 (decisions 14 and 16).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";

import { Layout } from "#core/bases/layout.base";
import { useLayoutData } from "#react/layout-data/use-layout-data";

class SiteLayout extends Layout {
  override async loader(): Promise<{ site: { name: string } }> {
    return { site: { name: "Acme" } };
  }
}

/** Shows the layout data it reads. */
function SiteName({ layoutKey }: { readonly layoutKey: string }) {
  const layout = useLayoutData<typeof SiteLayout>(layoutKey);
  return <p>{layout?.site.name ?? "none"}</p>;
}

afterEach(() => {
  cleanup();
});

describe("useLayoutData", () => {
  it("reads a layout's data by key, a mount's copy included", async () => {
    const router = createMemoryRouter(
      [
        {
          id: "ar-sa/site",
          path: "/",
          loader: () => ({ site: { name: "Acme" } }),
          element: <Outlet />,
          children: [{ index: true, element: <SiteName layoutKey="site" /> }],
        },
      ],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("Acme")).toBeTruthy();
  });

  it("is undefined for an unmatched key", async () => {
    const router = createMemoryRouter(
      [{ id: "page", path: "/", loader: () => null, element: <SiteName layoutKey="site" /> }],
      { initialEntries: ["/"] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("none")).toBeTruthy();
  });
});
