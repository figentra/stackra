// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `registerRoutePages` and `RegisteredRoutePage`: a registered page renders with the route's
 *          props, a later registration replaces it, the disposer removes only its own pages, and a missing
 *          registration throws naming it.
 * Boundary: test only; jsdom with Testing Library.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0307; ADR 0110.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ROUTE_PAGES } from "#react/route-pages/route-pages.constant";
import { registerRoutePages } from "#react/route-pages/register-route-pages.function";
import { RegisteredRoutePage } from "#react/route-pages/registered-route-page";

afterEach(() => {
  cleanup();
  delete ROUTE_PAGES.document;
});

describe("registerRoutePages", () => {
  it("renders the registered page, the latest registration winning", () => {
    registerRoutePages({ document: () => <p>first</p> });
    const dispose = registerRoutePages({ document: ({ document }) => <p>{String(document)}</p> });
    render(<RegisteredRoutePage kind="document" props={{ document: "welcome" }} />);
    expect(screen.getByText("welcome")).toBeTruthy();
    dispose();
    expect(ROUTE_PAGES.document).toBeUndefined();
  });

  it("throws naming a missing registration", () => {
    expect(() => render(<RegisteredRoutePage kind="panel" props={{}} />)).toThrow(
      /No panel page is registered/,
    );
  });
});
