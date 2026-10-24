/**
 * Stackra file contract:
 * Purpose: proves the web RouteOverlay is open exactly while its child route matches and is a dialog named by its
 *          title; closes from the close button and from Escape by leaving to the parent route (search kept, entry
 *          replaced), steps Back when the opener pushed the entry, replaces with `returnTo` after a deep link, and
 *          completes to a given path; draws a modal, a full-screen modal, a bottom sheet and a side drawer (a bottom
 *          sheet on a narrow window) for each presentation; refuses Escape while not dismissable and takes it back
 *          through `setDismissable`, while the close button stays; and shows the footer.
 * Boundary: jsdom with real HeroUI, React Aria and a React Router memory data router; the theme CSS is not loaded, so
 *           data attributes are checked, not looks, and focus return is the playground's e2e suite's. A role query
 *           finds nothing outside an open overlay (React Aria hides the page behind it), so each case holds what it
 *           needs before it opens one.
 * Runtime: browser
 * Governing contract: ADR 0314 (decisions 2 and 9); ADR 0312; ADR 0022 (test placement); WCAG 2.2 SC 2.1.2 and 4.1.2.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-179
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, Link, Outlet, RouterProvider, type InitialEntry } from "react-router";

import type { RouteOverlayContractProps } from "#contracts/types/route-overlay-contract-props.type";
import { RouteOverlay, type RouteOverlayProps } from "#react/route-overlay/route-overlay";
import { useRouteOverlay } from "#react/route-overlay/use-route-overlay";

/** The page inside the overlay: buttons that call the hook the way a form would. */
function Inside() {
  const overlay = useRouteOverlay();
  return (
    <div>
      <button type="button" onClick={() => overlay.complete("/orders/1/done")}>
        Save to done
      </button>
      <button type="button" onClick={() => overlay.complete()}>
        Save and close
      </button>
      <button type="button" onClick={() => overlay.setDismissable(false)}>
        Lock
      </button>
      <output>{overlay.isDismissable ? "dismissable" : "locked"}</output>
    </div>
  );
}

/** A parent page with a link and the outlet, and the overlay as the child route `edit`. */
function build(initialEntries: InitialEntry[], props: Partial<RouteOverlayProps> = {}) {
  const router = createMemoryRouter(
    [
      { path: "/orders", element: <h1>Orders</h1> },
      {
        path: "/orders/:id",
        element: (
          <main>
            <h1>Order</h1>
            <Link to="edit">Edit</Link>
            <Outlet />
          </main>
        ),
        children: [
          {
            path: "edit",
            element: (
              <RouteOverlay title="Edit order" closeLabel="Close" {...props}>
                <Inside />
              </RouteOverlay>
            ),
          },
          { path: "done", element: <p>Done</p> },
        ],
      },
    ],
    { initialEntries },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const where = (router: ReturnType<typeof build>) =>
  router.state.location.pathname + router.state.location.search;
const press = (name: string) => act(() => screen.getByRole("button", { name }).click());
const dialog = () => screen.getByRole("dialog");
const placement = () =>
  document.querySelector('[data-slot="drawer-content"]')?.getAttribute("data-placement");

describe("RouteOverlay (web)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is open only while its child route matches, and is a dialog named by its title", async () => {
    const router = build(["/orders/1"]);
    // Held before the overlay opens: React Aria hides the page behind it from a role query afterwards.
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => {
      await router.navigate("/orders/1/edit");
    });
    expect(screen.getByRole("dialog", { name: "Edit order" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Edit order" })).toBeTruthy();
    await act(async () => {
      await router.navigate("/orders/1");
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens straight from a deep link to the child route", () => {
    build(["/orders/1/edit"]);
    expect(screen.getByRole("dialog", { name: "Edit order" })).toBeTruthy();
  });

  it("closes to the parent route from the close button, keeping the search and replacing the entry", async () => {
    const router = build(["/orders/1/edit?tab=a"]);
    press("Close");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(where(router)).toBe("/orders/1?tab=a");
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("closes to the parent route on Escape", async () => {
    const router = build(["/orders/1/edit"]);
    fireEvent.keyDown(dialog(), { key: "Escape" });
    await waitFor(() => expect(where(router)).toBe("/orders/1"));
  });

  it("steps Back to where the opener was when the opener pushed the entry with returnTo", async () => {
    const router = build(["/orders/1"]);
    await act(async () => {
      await router.navigate("/orders/1/edit", { state: { returnTo: "/orders/1" } });
    });
    expect(router.state.historyAction).toBe("PUSH");
    press("Close");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(where(router)).toBe("/orders/1");
    expect(router.state.historyAction).toBe("POP");
  });

  it("replaces with returnTo after a deep link, where there is no entry to step back to", async () => {
    const router = build([{ pathname: "/orders/1/edit", state: { returnTo: "/orders" } }]);
    press("Close");
    await waitFor(() => expect(where(router)).toBe("/orders"));
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("completes to the path it is given, replacing the entry", async () => {
    const router = build(["/orders/1/edit"]);
    press("Save to done");
    await waitFor(() => expect(where(router)).toBe("/orders/1/done"));
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("completes to the parent route when no path is given", async () => {
    const router = build(["/orders/1/edit"]);
    press("Save and close");
    await waitFor(() => expect(where(router)).toBe("/orders/1"));
  });

  it("draws a modal for `modal` and a full-screen modal for `full-screen`", () => {
    const { unmount } = renderWith({ presentation: "modal" });
    expect(document.querySelector('[data-slot="modal-backdrop"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="drawer-backdrop"]')).toBeNull();
    unmount();
    renderWith({ presentation: "full-screen" });
    expect(document.querySelector('[data-slot="modal-backdrop"]')).not.toBeNull();
    expect(screen.getByRole("dialog").classList.contains("modal__dialog--full")).toBe(true);
  });

  it("draws a bottom sheet for `sheet` and a side drawer for `drawer`", () => {
    const { unmount } = renderWith({ presentation: "sheet" });
    expect(placement()).toBe("bottom");
    unmount();
    renderWith({ presentation: "drawer" });
    expect(placement()).toBe("right");
  });

  it("turns a `drawer` into a bottom sheet on a window narrower than 768 px", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    renderWith({ presentation: "drawer" });
    expect(placement()).toBe("bottom");
  });

  it("shows the footer under the body", () => {
    build(["/orders/1/edit"], { footer: <button type="button">Cancel</button> });
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });

  it("refuses Escape while it is not dismissable, and keeps the close button", async () => {
    const router = build(["/orders/1/edit"], { isDismissable: false });
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(where(router)).toBe("/orders/1/edit");
    expect(screen.getByRole("dialog", { name: "Edit order" })).toBeTruthy();
    press("Close");
    await waitFor(() => expect(where(router)).toBe("/orders/1"));
  });

  it("takes dismissal away mid-flow through setDismissable", () => {
    const router = build(["/orders/1/edit"]);
    expect(screen.getByRole("status").textContent).toBe("dismissable");
    press("Lock");
    expect(screen.getByRole("status").textContent).toBe("locked");
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(where(router)).toBe("/orders/1/edit");
  });

  it("takes the shared contract and nothing more", () => {
    expectTypeOf<RouteOverlayProps>().toEqualTypeOf<RouteOverlayContractProps>();
  });
});

/** Renders the overlay open on a deep link, with the props of one case. */
function renderWith(props: Partial<RouteOverlayProps>): { readonly unmount: () => void } {
  const router = createMemoryRouter(
    [
      {
        path: "/orders/:id",
        element: <Outlet />,
        children: [
          {
            path: "edit",
            element: (
              <RouteOverlay title="Edit order" closeLabel="Close" {...props}>
                Body
              </RouteOverlay>
            ),
          },
        ],
      },
    ],
    { initialEntries: ["/orders/1/edit"] },
  );
  const view = render(<RouterProvider router={router} />);
  return { unmount: view.unmount };
}
