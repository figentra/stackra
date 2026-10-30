/**
 * Stackra file contract:
 * Purpose: proves the web CommentThread: a region named by its label lists each comment with its author, time and
 *          highlighted mentions; a reply sends its trimmed text with the mentioned ids and clears; `@` suggests people
 *          and a pick completes the mention; resolve and reopen report the new state; a resolved thread takes no reply.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and text are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { CommentItem } from "#contracts/types/comment-item.type";
import { CommentThread } from "#react/comment-thread/comment-thread";

const press = (element: HTMLElement) => act(() => element.click());

const OMAR = { id: "p3", name: "Omar" };
const PEOPLE = [{ id: "p1", name: "Sara" }, { id: "p2", name: "Samir" }, OMAR];

const COMMENTS: readonly CommentItem[] = [
  { id: "c1", author: OMAR, body: "Ping @Sara please", createdAt: "2026-10-01T10:00:00Z" },
];

describe("CommentThread (web)", () => {
  it("lists comments with author, time and highlighted mentions", () => {
    render(<CommentThread label="Notes" comments={COMMENTS} people={PEOPLE} />);
    const region = screen.getByRole("region", { name: "Notes" });
    expect(within(region).getByText("Omar")).toBeTruthy();
    expect(region.querySelector("time")?.getAttribute("dateTime")).toBe("2026-10-01T10:00:00Z");
    expect(within(region).getByText("@Sara").tagName).toBe("BDI");
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Resolve" })).toBeNull();
  });

  it("suggests people after @, completes the mention, and sends the reply with its mentions", () => {
    const onReply = vi.fn();
    render(<CommentThread label="Notes" comments={[]} people={PEOPLE} onReply={onReply} />);
    const box = screen.getByRole("textbox", { name: "Reply" }) as HTMLTextAreaElement;
    const send = screen.getByRole("button", { name: "Send" });
    press(send);
    expect(onReply).not.toHaveBeenCalled();
    fireEvent.change(box, { target: { value: "Hi @Sa" } });
    const people = screen.getByRole("list", { name: "People to mention" });
    expect(
      within(people)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["@Sara", "@Samir"]);
    press(within(people).getByRole("button", { name: "@Samir" }));
    expect(box.value).toBe("Hi @Samir ");
    expect(screen.queryByRole("list", { name: "People to mention" })).toBeNull();
    press(send);
    expect(onReply).toHaveBeenCalledWith("Hi @Samir", ["p2"]);
    expect(box.value).toBe("");
  });

  it("resolves an open thread and reopens a resolved one, which takes no reply", () => {
    const onResolvedChange = vi.fn();
    const { rerender } = render(
      <CommentThread
        label="Notes"
        comments={COMMENTS}
        onReply={vi.fn()}
        onResolvedChange={onResolvedChange}
      />,
    );
    press(screen.getByRole("button", { name: "Resolve" }));
    expect(onResolvedChange).toHaveBeenLastCalledWith(true);
    rerender(
      <CommentThread
        label="Notes"
        comments={COMMENTS}
        onReply={vi.fn()}
        isResolved
        onResolvedChange={onResolvedChange}
      />,
    );
    expect(screen.getByText("Resolved")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    press(screen.getByRole("button", { name: "Reopen" }));
    expect(onResolvedChange).toHaveBeenLastCalledWith(false);
  });

  it("shows the resolved chip without a toggle when none is given", () => {
    render(<CommentThread label="Notes" comments={COMMENTS} isResolved />);
    expect(screen.getByText("Resolved")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
