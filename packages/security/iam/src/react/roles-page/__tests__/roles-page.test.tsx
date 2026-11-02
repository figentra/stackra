/**
 * Stackra file contract:
 * Purpose: proves the RolesPage titles itself with the host's words, shows the built-in roles read-only and the custom
 *          roles as named checkboxes when editable, lists only the chosen modules' groups, saves the custom roles'
 *          grants from the header's button and announces it, keeps the edits and shows the host's `failed` words in an
 *          alert when a save fails, offers no save when not editable, and keeps the layout logical in Arabic.
 * Boundary: unit tier, jsdom with the real @stackra/ui components (their own words in English, as no I18nProvider is
 *           mounted); the Arabic case renders under `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0208; ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { vi } from "vitest";

import { RolesPage } from "#react/roles-page/roles-page";
import type { RolesPageProps } from "#react/roles-page/roles-page.props";

const ROLES: RolesPageProps["roles"] = [
  { id: "owner", label: "Owner" },
  { id: "auditor", label: "Auditor", isCustom: true },
];
const GROUPS: RolesPageProps["groups"] = [
  {
    id: "orders",
    label: "Orders",
    permissions: [
      { id: "orders.order.read", label: "View orders" },
      { id: "orders.order.cancel", label: "Cancel orders" },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    permissions: [{ id: "billing.invoice.read", label: "View invoices" }],
  },
];
const GRANTS = {
  owner: ["orders.order.read", "orders.order.cancel", "billing.invoice.read"],
  auditor: ["orders.order.read"],
};
const LABELS = {
  title: "Roles and permissions",
  description: "Choose what each role can do.",
  builtIn: "Built-in roles",
  custom: "Custom roles",
  save: "Save changes",
  saving: "Saving…",
  saved: "Changes saved.",
  failed: "Couldn't save the changes.",
};

const page = (props: Partial<RolesPageProps> = {}) => (
  <RolesPage roles={ROLES} groups={GROUPS} grants={GRANTS} labels={LABELS} {...props} />
);

/** The checkbox of the auditor's cell for `permission`, by its accessible name. */
const auditorCell = (permission: string) =>
  within(screen.getByRole("table", { name: "Custom roles" })).getByRole("checkbox", {
    name: `${permission} for Auditor`,
  });

describe("RolesPage", () => {
  afterEach(cleanup);

  it("titles itself and shows the built-in roles read-only", () => {
    render(page({ isEditable: true, onSave: vi.fn() }));
    expect(screen.getByRole("heading", { level: 1, name: "Roles and permissions" })).toBeTruthy();
    expect(screen.getByText("Choose what each role can do.")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Built-in roles" })).toBeTruthy();
    const builtIn = screen.getByRole("table", { name: "Built-in roles" });
    expect(within(builtIn).queryAllByRole("checkbox")).toHaveLength(0);
    expect(within(builtIn).getByRole("columnheader", { name: /Owner/ })).toBeTruthy();
    expect(
      within(screen.getByRole("table", { name: "Custom roles" })).getAllByRole("checkbox").length,
    ).toBeGreaterThan(0);
  });

  it("lists only the chosen modules' groups", () => {
    render(page({ permissionGroups: ["billing"] }));
    expect(screen.queryAllByRole("rowheader", { name: /View orders/ })).toHaveLength(0);
    expect(screen.getAllByRole("rowheader", { name: /View invoices/ }).length).toBeGreaterThan(0);
  });

  it("offers no save and no checkboxes when not editable", () => {
    render(page({ onSave: vi.fn() }));
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("saves the custom roles' grants from a focused cell and announces it", async () => {
    const onSave = vi.fn(() => Promise.resolve());
    render(page({ isEditable: true, onSave }));
    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button.hasAttribute("disabled")).toBe(true);
    const cell = auditorCell("Cancel orders");
    act(() => cell.focus());
    expect(document.activeElement).toBe(cell);
    fireEvent.click(cell);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save changes" }).hasAttribute("disabled")).toBe(
        false,
      ),
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    });
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        auditor: ["orders.order.read", "orders.order.cancel"],
      }),
    );
    expect((await screen.findByRole("status")).textContent).toBe("Changes saved.");
  });

  it("keeps the edits and shows the host's words when a save fails", async () => {
    const onSave = vi.fn(() => Promise.reject(new Error("refused")));
    render(page({ isEditable: true, onSave }));
    fireEvent.click(auditorCell("Cancel orders"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    });
    expect((await screen.findByRole("alert")).textContent).toBe(LABELS.failed);
    expect(screen.getByRole("button", { name: "Save changes" }).hasAttribute("disabled")).toBe(
      false,
    );
  });

  it("keeps the layout logical in Arabic", () => {
    const { container } = render(
      <div dir="rtl">
        {page({
          roles: [{ id: "auditor", label: "مدقق", isCustom: true }],
          isEditable: true,
          onSave: vi.fn(),
        })}
      </div>,
    );
    expect(screen.getByRole("table", { name: "Custom roles" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /مدقق/ })).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Built-in roles" })).toBeNull();
    expect(container.innerHTML).not.toMatch(/\b(text-left|text-right|ml-\d|mr-\d|pl-\d|pr-\d)\b/);
  });
});
