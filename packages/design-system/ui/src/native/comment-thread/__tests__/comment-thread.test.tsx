/**
 * Stackra file contract:
 * Purpose: proves the native CommentThread: each comment shows its author, its time in the provider's locale and its
 *          mentions picked out; the resolved chip and the resolve or reopen button follow the state; the reply box
 *          suggests people for an open `@`, completes the mention on press, sends the trimmed body with the mentioned
 *          ids and clears, holds send while empty, and hides once resolved or without onReply.
 * Boundary: React Native does not render in vitest, so it and the house Avatar, Button, Chip, Text and TextArea are
 *           stand-ins that render plain DOM; what the thread reports is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { CommentThread } from "#native/comment-thread/comment-thread";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "aria-label": props["accessibilityLabel"] as string },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { className: props["className"] as string },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/avatar/avatar", async () => {
  const { createElement } = await import("react");
  return {
    Avatar: (props: Record<string, unknown>) =>
      createElement("img", { alt: props["name"] as string }),
  };
});
vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return {
    Chip: (props: Record<string, unknown>) =>
      createElement("mark", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          disabled: props["isDisabled"],
          "data-icon": props["startIcon"],
          onClick: props["onPress"],
        },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/text-area/text-area", async () => {
  const { createElement } = await import("react");
  return {
    TextArea: (props: Record<string, unknown>) =>
      createElement("textarea", {
        "aria-label": props["label"] as string,
        value: props["value"] as string,
        onChange: (event: { target: { value: string } }) =>
          (props["onChange"] as (value: string) => void)(event.target.value),
      }),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const K = "ui::comment_thread.";
const ADA = { id: "u1", name: "Ada" };
const PEOPLE = [ADA, { id: "u2", name: "Alan" }, { id: "u3", name: "Bob" }];
const COMMENTS = [
  { id: "c1", author: ADA, body: "Ping @Bob please", createdAt: "2026-10-01T09:30:00Z" },
];
const type = (text: string) =>
  fireEvent.change(screen.getByLabelText(`${K}reply`), { target: { value: text } });

describe("CommentThread (native)", () => {
  it("shows each comment with its author, locale time and mentions picked out", () => {
    render(
      <DesignSystemContext value={{ locale: "en-US", direction: "ltr" } as DesignSystemState}>
        <CommentThread comments={COMMENTS} people={PEOPLE} label="Thread" />
      </DesignSystemContext>,
    );
    expect(screen.getByLabelText("Thread")).toBeTruthy();
    expect(screen.getByAltText("Ada")).toBeTruthy();
    expect(screen.getByText(/Oct 1, 2026/)).toBeTruthy();
    expect(screen.getByText("@Bob").className).toContain("text-accent-soft-foreground");
    expect(screen.getByText("Ping")).toBeTruthy();
    expect(screen.queryByLabelText(`${K}reply`)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("resolves and reopens from its button, hiding the reply box once resolved", () => {
    const onResolvedChange = vi.fn();
    const { rerender } = render(
      <CommentThread
        comments={COMMENTS}
        label="Thread"
        onReply={vi.fn()}
        onResolvedChange={onResolvedChange}
      />,
    );
    expect(screen.queryByText(`${K}resolved`)).toBeNull();
    fireEvent.click(screen.getByText(`${K}resolve`));
    expect(onResolvedChange).toHaveBeenCalledWith(true);
    rerender(
      <CommentThread
        comments={COMMENTS}
        label="Thread"
        onReply={vi.fn()}
        isResolved
        onResolvedChange={onResolvedChange}
      />,
    );
    expect(screen.getByText(`${K}resolved`)).toBeTruthy();
    expect(screen.getByText(`${K}reopen`).dataset["icon"]).toBe("rotate-ccw");
    fireEvent.click(screen.getByText(`${K}reopen`));
    expect(onResolvedChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByLabelText(`${K}reply`)).toBeNull();
  });

  it("shows the resolved chip alone without onResolvedChange", () => {
    render(<CommentThread comments={[]} label="Thread" isResolved />);
    expect(screen.getByText(`${K}resolved`)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("suggests people for an open mention, completes it and sends with the mentioned ids", () => {
    const onReply = vi.fn();
    render(<CommentThread comments={[]} people={PEOPLE} label="Thread" onReply={onReply} />);
    expect(screen.getByText(`${K}send`)).toHaveProperty("disabled", true);
    type("Hi @a");
    expect(screen.getByLabelText(`${K}people`)).toBeTruthy();
    expect(screen.getAllByText(/^@/).map((button) => button.textContent)).toEqual([
      "@Ada",
      "@Alan",
    ]);
    fireEvent.click(screen.getByText("@Alan"));
    expect((screen.getByLabelText(`${K}reply`) as HTMLTextAreaElement).value).toBe("Hi @Alan ");
    expect(screen.queryByLabelText(`${K}people`)).toBeNull();
    fireEvent.click(screen.getByText(`${K}send`));
    expect(onReply).toHaveBeenCalledWith("Hi @Alan", ["u2"]);
    expect((screen.getByLabelText(`${K}reply`) as HTMLTextAreaElement).value).toBe("");
  });

  it("sends nothing for a blank draft and suggests nobody without people", () => {
    const onReply = vi.fn();
    render(<CommentThread comments={[]} label="Thread" onReply={onReply} />);
    type("@");
    expect(screen.queryByLabelText(`${K}people`)).toBeNull();
    type("   ");
    fireEvent.click(screen.getByText(`${K}send`));
    expect(onReply).not.toHaveBeenCalled();
  });
});
