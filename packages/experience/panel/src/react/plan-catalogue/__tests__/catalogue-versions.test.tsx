/**
 * Stackra file contract:
 * Purpose: unit tests of `CatalogueVersions`: versions newest first with their state and the in-force mark, a pending
 *          discount offers approve and reject to a second person, its proposer only withdraws it, and a decided
 *          version offers nothing.
 * Boundary: unit tier, jsdom; the web kit is DOM stand-ins, translation returns the key with its values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0391 (decision 4); owner OS-381.
 */
// @vitest-environment jsdom
import type { CatalogueVersion } from "@stackra/entitlements/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { CatalogueVersions } from "#react/plan-catalogue/catalogue-versions";

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
  }),
  useDateTime: () => (value: Date) => value.toISOString().slice(0, 10),
}));
vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  const box =
    (tag: string) =>
    ({ children }: { children?: ReactNode }) =>
      createElement(tag, null, children);
  return {
    Card: Object.assign(box("section"), {
      Header: box("header"),
      Title: box("h2"),
      Content: box("div"),
    }),
    Chip: box("span"),
    Text: box("p"),
    Button: ({ children, onPress }: { children?: ReactNode; onPress: () => void }) =>
      createElement("button", { type: "button", onClick: onPress }, children),
  };
});

afterEach(cleanup);

/** One version of `price-list:commerce`. */
const version = (overrides: Partial<CatalogueVersion>): CatalogueVersion => ({
  key: "price-list:commerce",
  kind: "price-list",
  version: 1,
  rows: [],
  effectiveFrom: new Date("2026-01-01T00:00:00Z"),
  discount: false,
  state: "approved",
  proposedBy: "seed-pack:commerce",
  proposedAt: new Date("2026-01-01T00:00:00Z"),
  decidedBy: "seed-pack:commerce",
  ...overrides,
});

const HISTORY = [
  version({}),
  version({
    version: 2,
    discount: true,
    state: "pending",
    proposedBy: "usr_rana",
    effectiveFrom: new Date("2026-12-01T00:00:00Z"),
  }),
];

describe("CatalogueVersions", () => {
  it("lists versions newest first and marks the one in force", () => {
    const { container } = render(
      <CatalogueVersions
        versions={HISTORY}
        viewer="usr_omar"
        at={new Date("2026-10-26T00:00:00Z")}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    const items = [...container.querySelectorAll("li")];
    expect(items.map((item) => item.dataset["version"])).toEqual(["2", "1"]);
    expect(items[1]?.textContent).toContain("panel::plan_catalogue.in_force");
    expect(items[0]?.textContent).toContain("panel::plan_catalogue.state_pending");
  });

  it("lets a second person approve or reject a pending discount", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <CatalogueVersions
        versions={HISTORY}
        viewer="usr_omar"
        onApprove={onApprove}
        onReject={onReject}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "panel::plan_catalogue.approve" }));
    fireEvent.click(screen.getByRole("button", { name: "panel::plan_catalogue.reject" }));
    expect(onApprove).toHaveBeenCalledWith(HISTORY[1]);
    expect(onReject).toHaveBeenCalledWith(HISTORY[1]);
  });

  it("lets the proposer only withdraw, and says a second person must approve", () => {
    render(
      <CatalogueVersions
        versions={HISTORY}
        viewer="usr_rana"
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "panel::plan_catalogue.approve" })).toBeNull();
    expect(screen.getByRole("button", { name: "panel::plan_catalogue.withdraw" })).toBeTruthy();
    expect(screen.getByText("panel::plan_catalogue.own_proposal")).toBeTruthy();
  });
});
