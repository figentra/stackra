/**
 * Stackra file contract:
 * Purpose: proves the Theme Studio titles itself, reads its knobs from the address, writes a change back to it,
 *          undoes and redoes a change, resets to the stackra theme, shows the preview in the derived theme, exports the
 *          full JSON by default and a changes-only JSON on request, and lists what is wrong with a bad import.
 * Boundary: a memory router in jsdom inside the DesignSystemProvider; no network, no clipboard.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0022 (test placement).
 */
import { DesignSystemProvider, RouterProvider as AriaRouterProvider } from "@stackra/ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { ThemeStudio } from "#src/routes/theme-studio/theme-studio";
import { ThemeStudioRoute } from "#src/routes/theme-studio/theme-studio.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderStudio(url = routePath(ThemeStudioRoute)) {
  const router = createMemoryRouter(
    [
      {
        path: routePath(ThemeStudioRoute),
        element: (
          <AriaRouterProvider navigate={() => undefined}>
            <DesignSystemProvider colorScheme="light">
              <ThemeStudio />
            </DesignSystemProvider>
          </AriaRouterProvider>
        ),
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const preview = () =>
  screen.getByRole("region", { name: "Preview" }).querySelector<HTMLElement>("[data-theme]") ??
  document.body;
const history = () => within(screen.getByRole("toolbar", { name: "History" }));
const code = () => screen.getByRole("region", { name: /the export/ }).textContent ?? "";

describe("ThemeStudio", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the document after its h1", () => {
    renderStudio();
    expect(screen.getByRole("heading", { level: 1, name: "Theme Studio" })).toBeTruthy();
    expect(document.title).toBe("Theme Studio · Stackra Playground");
  });

  it("reads its knobs from the address and shows the derived theme in the preview", () => {
    renderStudio("/theme-studio?accent=40,0.16&radius=8");
    expect(preview().style.getPropertyValue("--accent")).toBe("oklch(0.52 0.16 40)");
    expect(preview().style.getPropertyValue("--radius")).toBe("8px");
  });

  it("writes a change to the address, undoes and redoes it", () => {
    const router = renderStudio("/theme-studio?scheme=dark");
    act(() => {
      fireEvent.change(screen.getByRole("slider", { name: "Corner radius" }), {
        target: { value: "10" },
      });
    });
    expect(router.state.location.search).toBe("?scheme=dark&radius=10");
    act(() => history().getByRole("button", { name: "Undo" }).click());
    expect(router.state.location.search).toBe("?scheme=dark");
    act(() => history().getByRole("button", { name: "Redo" }).click());
    expect(router.state.location.search).toBe("?scheme=dark&radius=10");
    act(() => history().getByRole("button", { name: "Reset" }).click());
    expect(router.state.location.search).toBe("?scheme=dark");
  });

  it("exports the full JSON by default", () => {
    renderStudio();
    expect(code()).toContain('"format": "stackra.theme/1"');
    expect(code()).toContain('"heroui"');
  });

  it("lists what is wrong with a bad import and keeps the theme", () => {
    renderStudio();
    fireEvent.change(screen.getByRole("textbox", { name: "Paste a theme JSON" }), {
      target: { value: "{not json" },
    });
    act(() => screen.getByRole("button", { name: "Import" }).click());
    expect(screen.getByRole("alert").textContent).toContain("the file is not JSON");
  });
});
