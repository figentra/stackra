/**
 * Stackra file contract:
 * Purpose: proves the web Popconfirm opens an alertdialog named by its question and described by its detail, starts
 *          focus on confirm (on cancel when danger), confirms and closes, cancels on the cancel button and on Escape,
 *          and keeps a pending confirm open until its promise resolves, staying open when it rejects.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Button } from "#react/button/button";
import { Popconfirm } from "#react/popconfirm/popconfirm";

const press = (element: HTMLElement) => act(() => element.click());
const trigger = <Button>Delete draft</Button>;
const open = () => press(screen.getByRole("button", { name: "Delete draft" }));

describe("Popconfirm (web)", () => {
  it("opens an alertdialog named by the question, focus on confirm", async () => {
    render(
      <Popconfirm
        trigger={trigger}
        title="Delete this draft?"
        description="It cannot be restored."
      />,
    );
    open();
    const dialog = screen.getByRole("alertdialog", { name: "Delete this draft?" });
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    const confirm = screen.getByRole("button", { name: "Confirm" });
    await vi.waitFor(() => expect(document.activeElement).toBe(confirm));
  });

  it("starts on cancel when the tone is danger, and cancels", async () => {
    const onCancel = vi.fn();
    render(
      <Popconfirm
        trigger={trigger}
        title="Delete this draft?"
        tone="danger"
        confirmLabel="Delete"
        onCancel={onCancel}
      />,
    );
    open();
    const cancel = screen.getByRole("button", { name: "Cancel" });
    await vi.waitFor(() => expect(document.activeElement).toBe(cancel));
    press(cancel);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("confirms and closes", () => {
    const onConfirm = vi.fn();
    render(<Popconfirm trigger={trigger} title="Delete this draft?" onConfirm={onConfirm} />);
    open();
    press(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("cancels on Escape", () => {
    const onCancel = vi.fn();
    render(<Popconfirm trigger={trigger} title="Delete this draft?" onCancel={onCancel} />);
    open();
    fireEvent.keyDown(screen.getByRole("button", { name: "Confirm" }), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("stays open while a confirm is pending, and after it is refused", async () => {
    let settle: { resolve: () => void; reject: () => void } = {
      resolve: () => undefined,
      reject: () => undefined,
    };
    const onConfirm = () =>
      new Promise<void>((resolve, reject) => {
        settle = { resolve, reject: () => reject(new Error("refused")) };
      });
    render(<Popconfirm trigger={trigger} title="Delete this draft?" onConfirm={onConfirm} />);
    open();
    press(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await act(async () => settle.reject());
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    press(screen.getByRole("button", { name: "Confirm" }));
    await act(async () => settle.resolve());
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
