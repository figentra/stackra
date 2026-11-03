/**
 * Stackra file contract:
 * Purpose: proves `Can` shows its children while the session holds the permission and its fallback while it does not,
 *          needs every key by default and one of them with `mode="any"`, follows the snapshot when it changes, draws
 *          no element of its own (so a shown control keeps its role and its place in the tab order) and keeps a shown
 *          Arabic subtree in its direction.
 * Boundary: unit tier, jsdom, a real `PermissionSnapshotService` in a container; the Arabic case renders under
 *           `dir="rtl"`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0208 (decision 6); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { PermissionSnapshotService } from "#core/index";
import { Can } from "#react/can/can";

/** A snapshot holding `keys` and a wrapper that binds it. */
async function setUp(keys: readonly string[] = []) {
  const snapshot = new PermissionSnapshotService();
  snapshot.set(keys);
  const container = await Container.create([], {
    overrides: new Map([[PermissionSnapshotService, snapshot]]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { snapshot, wrap };
}

const CANCEL = <button type="button">Cancel order</button>;
const DENIED = <p>No access</p>;

describe("Can", () => {
  afterEach(cleanup);

  it("shows the children while the permission is held", async () => {
    const { wrap } = await setUp(["orders.order.cancel"]);
    render(
      wrap(
        <Can permission="orders.order.cancel" fallback={DENIED}>
          {CANCEL}
        </Can>,
      ),
    );
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeTruthy();
    expect(screen.queryByText("No access")).toBeNull();
  });

  it("shows the fallback, or nothing, while it is not", async () => {
    const { wrap } = await setUp(["orders.order.read"]);
    const { container, rerender } = render(
      wrap(
        <Can permission="orders.order.cancel" fallback={DENIED}>
          {CANCEL}
        </Can>,
      ),
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("No access")).toBeTruthy();
    rerender(wrap(<Can permission="orders.order.cancel">{CANCEL}</Can>));
    expect(container.textContent).toBe("");
  });

  it("needs every key by default and one of them with mode any", async () => {
    const { wrap } = await setUp(["orders.order.read"]);
    const keys = ["orders.order.read", "orders.order.cancel"];
    const { rerender } = render(wrap(<Can permission={keys}>{CANCEL}</Can>));
    expect(screen.queryByRole("button")).toBeNull();
    rerender(
      wrap(
        <Can permission={keys} mode="any">
          {CANCEL}
        </Can>,
      ),
    );
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeTruthy();
  });

  it("follows the snapshot when it changes", async () => {
    const { snapshot, wrap } = await setUp();
    render(
      wrap(
        <Can permission="orders.order.cancel" fallback={DENIED}>
          {CANCEL}
        </Can>,
      ),
    );
    expect(screen.getByText("No access")).toBeTruthy();
    act(() => snapshot.set(["orders.*"]));
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeTruthy();
    act(() => snapshot.set([]));
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("draws no element of its own, so the control stays keyboard reachable", async () => {
    const { wrap } = await setUp(["orders.order.cancel"]);
    const { container } = render(wrap(<Can permission="orders.order.cancel">{CANCEL}</Can>));
    const button = screen.getByRole("button", { name: "Cancel order" });
    expect(button.parentElement).toBe(container.firstElementChild);
    act(() => button.focus());
    expect(document.activeElement).toBe(button);
  });

  it("keeps a shown Arabic subtree in its direction", async () => {
    const { wrap } = await setUp(["orders.order.cancel"]);
    render(
      wrap(
        <Can permission="orders.order.cancel">
          <button type="button">إلغاء الطلب</button>
        </Can>,
        "rtl",
      ),
    );
    const button = screen.getByRole("button", { name: "إلغاء الطلب" });
    expect(button.closest("[dir]")?.getAttribute("dir")).toBe("rtl");
  });
});
