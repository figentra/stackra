/**
 * Stackra file contract:
 * Purpose: proves the RolePicker is a combo box named by the host's label, asks the host's `loadOptions` for the first
 *          roles when its list opens, picks one role with the keyboard and reports the whole record, says the host's
 *          words when no role matches and when the load fails, offers the host's create-new row, and keeps a role's
 *          name in a right-to-left page.
 * Boundary: unit tier, jsdom with the real @stackra/ui `EntityPicker` (HeroUI and React Aria); the browser's
 *           IntersectionObserver is a silent stand-in, as in the EntityPicker test. The Arabic case renders under
 *           `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0055; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import type { EntityOption, EntityOptionPage } from "@stackra/ui/contracts";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { RolePicker } from "#react/role-picker/role-picker";

const ROLES: readonly EntityOption[] = [
  { id: "orders.order_clerk", label: "Order clerk", description: "Takes and edits orders" },
  { id: "orders.manager", label: "Orders manager" },
];

const LABELS = {
  label: "Role",
  loading: "Loading roles",
  empty: "No roles found",
  loadError: "Roles could not be loaded.",
  placeholder: "Choose a role",
};

/** Answers from `roles` by label. */
const rolesOf =
  (roles: readonly EntityOption[] = ROLES) =>
  (search: string): Promise<EntityOptionPage> =>
    Promise.resolve({
      items: roles.filter((role) => role.label.toLowerCase().includes(search.toLowerCase())),
      nextCursor: null,
    });

/** Opens the list with its button, as a pointer user does. */
const openList = () => {
  const button = screen
    .getByRole("combobox")
    .closest('[data-slot="combo-box"]')
    ?.querySelector("button");
  if (!(button instanceof HTMLElement)) throw new Error("the list button is missing");
  act(() => button.click());
};

describe("RolePicker", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    // jsdom has no layout; the list scrolls the focused option into view.
    Object.defineProperty(Element.prototype, "scrollTo", {
      value: () => undefined,
      configurable: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "scrollTo");
  });

  it("is a combo box named by the host's label with the host's placeholder", () => {
    const load = vi.fn(rolesOf());
    render(<RolePicker loadOptions={load} labels={LABELS} />);
    const input = screen.getByRole("combobox", { name: /Role/ });
    expect(input.getAttribute("placeholder")).toBe("Choose a role");
    expect(load).not.toHaveBeenCalled();
  });

  it("asks loadOptions for the first roles when the list opens and lists them", async () => {
    const load = vi.fn(rolesOf());
    render(<RolePicker loadOptions={load} labels={LABELS} />);
    openList();
    expect(load).toHaveBeenCalledWith("", undefined);
    expect(await screen.findByRole("option", { name: /Order clerk/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Orders manager/ })).toBeTruthy();
  });

  it("picks a role with the keyboard and reports the whole record", async () => {
    const onChange = vi.fn();
    render(<RolePicker loadOptions={rolesOf()} labels={LABELS} onChange={onChange} />);
    const input = screen.getByRole("combobox");
    act(() => input.focus());
    await screen.findByRole("option", { name: /Order clerk/ });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(ROLES[0]));
    await waitFor(() => expect((input as HTMLInputElement).value).toBe("Order clerk"));
  });

  it("says the host's words when no role matches and when the load fails", async () => {
    const { unmount } = render(<RolePicker loadOptions={rolesOf([])} labels={LABELS} />);
    openList();
    expect(await screen.findByText("No roles found")).toBeTruthy();
    unmount();
    render(<RolePicker loadOptions={() => Promise.reject(new Error("down"))} labels={LABELS} />);
    openList();
    expect(await screen.findByText("Roles could not be loaded.")).toBeTruthy();
  });

  it("offers the host's create-new row for typed text", async () => {
    const onCreate = vi.fn();
    render(
      <RolePicker
        loadOptions={rolesOf([])}
        onCreate={onCreate}
        debounceMs={0}
        labels={{ ...LABELS, create: (text) => `Add role "${text}"` }}
      />,
    );
    const input = screen.getByRole("combobox");
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "Auditor" } });
    const row = await screen.findByRole("option", { name: /Add role "Auditor"/ });
    act(() => row.click());
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Auditor"));
  });

  it("keeps a role's name in a right-to-left page", async () => {
    render(
      <div dir="rtl">
        <RolePicker
          loadOptions={rolesOf([{ id: "orders.manager", label: "مدير الطلبات" }])}
          labels={{ ...LABELS, label: "الدور" }}
        />
      </div>,
    );
    const input = screen.getByRole("combobox", { name: /الدور/ });
    expect(input.closest("[dir]")?.getAttribute("dir")).toBe("rtl");
    openList();
    expect(await screen.findByRole("option", { name: /مدير الطلبات/ })).toBeTruthy();
  });
});
