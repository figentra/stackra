/**
 * Stackra file contract:
 * Purpose: proves the command palette opens as a modal dialog, filters the pages by every typed word (title,
 *          category or tier), announces the count, says so when nothing matches, opens the first match on Enter,
 *          walks the matches with the arrow keys, and reports its own close.
 * Boundary: a memory router in jsdom with a stubbed `<dialog>` (jsdom has no showModal); no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { CommandPalette } from "#src/components/command-palette";
import type { PageLink } from "#src/types/page-link.type";

const PAGES: readonly PageLink[] = [
  { path: "/button", title: "Button", category: "Actions", tier: "Free" },
  { path: "/close-button", title: "Close button", category: "Actions", tier: "Free" },
  { path: "/checkbox", title: "Checkbox", category: "Selection", tier: "Free" },
  { path: "/pro-kanban", title: "Kanban", category: "Surfaces", tier: "Pro" },
];

// jsdom has no modal dialog: opening and closing only flip `open`.
function showModal(this: HTMLDialogElement) {
  this.open = true;
}

function close(this: HTMLDialogElement) {
  this.open = false;
}

function renderPalette(onClose = vi.fn()) {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: <CommandPalette pages={PAGES} search="?scheme=dark" isOpen onClose={onClose} />,
      },
    ],
    { initialEntries: ["/"] },
  );
  render(<RouterProvider router={router} />);
  return { router, onClose };
}

const type = (text: string) =>
  fireEvent.change(screen.getByRole("searchbox", { name: "Search components" }), {
    target: { value: text },
  });

describe("CommandPalette", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = showModal;
    HTMLDialogElement.prototype.close = close;
  });

  it("opens as a dialog listing every page, grouped by category", () => {
    renderPalette();
    const dialog = screen.getByRole("dialog", { name: "Search components" });
    expect((dialog as HTMLDialogElement).open).toBe(true);
    expect(within(dialog).getAllByRole("link")).toHaveLength(4);
    expect(within(dialog).getByRole("list", { name: "Actions" })).toBeTruthy();
    expect(within(dialog).getByRole("status").textContent).toBe("4 matches");
  });

  it("filters by every typed word, across title, category and tier", () => {
    renderPalette();
    type("close but");
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Close button"]);
    expect(screen.getByRole("status").textContent).toBe("1 match");
    type("pro");
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["KanbanPro"]);
    type("selection");
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Checkbox"]);
  });

  it("says so when nothing matches", () => {
    renderPalette();
    type("zzz");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText("Nothing matches “zzz”.")).toBeTruthy();
  });

  it("opens the first match on Enter, keeping the search params", async () => {
    const { router } = renderPalette();
    type("check");
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });
    });
    expect(router.state.location.pathname).toBe("/checkbox");
    expect(router.state.location.search).toBe("?scheme=dark");
  });

  it("walks the matches with the arrow keys, wrapping at the ends", () => {
    renderPalette();
    const dialog = screen.getByRole("dialog");
    const links = within(dialog).getAllByRole("link");
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(links[0]);
    fireEvent.keyDown(dialog, { key: "ArrowDown" });
    expect(document.activeElement).toBe(links[1]);
    fireEvent.keyDown(dialog, { key: "ArrowUp" });
    fireEvent.keyDown(dialog, { key: "ArrowUp" });
    expect(document.activeElement).toBe(links[3]);
  });

  it("reports its close (Escape or the scrim) to the caller", () => {
    const { onClose } = renderPalette();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent(dialog, new Event("close"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
