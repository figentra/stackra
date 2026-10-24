/**
 * Stackra file contract:
 * Purpose: proves the web RouteLeaveConfirmation holds a navigation away while `when` is true and asks through the
 *          `LeaveConfirmation` handle: Discard lets the navigation proceed, Stay cancels it, no question is asked while
 *          `when` is false, and asks once per blocked navigation, proceeding only after the answer.
 * Boundary: jsdom with a React Router memory data router and a stand-in for `LeaveConfirmation`, whose answer the test
 *           decides; the real dialog is proved by `@stackra/ui` and the playground's e2e suite. What reaches the
 *           stand-in (`when`, the words) is checked as well.
 * Runtime: browser
 * Governing contract: ADR 0317 (decision 2); ADR 0312; ADR 0022 (test placement); WCAG 2.2 SC 3.3.4.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-181
import { act, render, screen, waitFor } from "@testing-library/react";
import { useImperativeHandle, type Ref } from "react";
import { createMemoryRouter, Link, RouterProvider } from "react-router";

import { RouteLeaveConfirmation } from "#react/route-leave-confirmation/route-leave-confirmation";

/** What the stand-in was last given, and how it answers. */
const stub = vi.hoisted(() => ({
  props: {} as Record<string, unknown>,
  ask: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("@stackra/ui/react", () => ({
  LeaveConfirmation: (props: {
    readonly when: boolean;
    readonly ref?: Ref<{ confirmLeave: () => Promise<boolean> }>;
  }) => {
    const { ref, ...rest } = props;
    stub.props = rest;
    useImperativeHandle(ref, () => ({ confirmLeave: () => stub.ask() }), []);
    return null;
  },
}));

/** A form page that guards `when` and links to another page. */
function build(when: boolean) {
  const router = createMemoryRouter(
    [
      {
        path: "/form",
        element: (
          <>
            <RouteLeaveConfirmation
              when={when}
              title="Discard?"
              description="Lost."
              stayLabel="Stay"
              discardLabel="Discard"
            />
            <Link to="/other">Leave</Link>
          </>
        ),
      },
      { path: "/other", element: <p>Other</p> },
    ],
    { initialEntries: ["/form"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const leave = () => act(() => screen.getByRole("link", { name: "Leave" }).click());

describe("RouteLeaveConfirmation (web)", () => {
  beforeEach(() => {
    stub.ask.mockReset();
  });

  it("hands LeaveConfirmation its props", () => {
    build(true);
    expect(stub.props).toMatchObject({ when: true, title: "Discard?", stayLabel: "Stay" });
  });

  it("lets the navigation proceed on Discard", async () => {
    stub.ask.mockResolvedValue(true);
    const router = build(true);
    leave();
    await waitFor(() => expect(router.state.location.pathname).toBe("/other"));
    expect(stub.ask).toHaveBeenCalledTimes(1);
  });

  it("keeps the user on the page on Stay", async () => {
    stub.ask.mockResolvedValue(false);
    const router = build(true);
    leave();
    await waitFor(() => expect(stub.ask).toHaveBeenCalledTimes(1));
    expect(router.state.location.pathname).toBe("/form");
    // The blocker was reset, so a later attempt asks again.
    leave();
    await waitFor(() => expect(stub.ask).toHaveBeenCalledTimes(2));
  });

  it("does not ask while nothing is unsaved", async () => {
    const router = build(false);
    leave();
    await waitFor(() => expect(router.state.location.pathname).toBe("/other"));
    expect(stub.ask).not.toHaveBeenCalled();
  });

  it("asks once for one blocked navigation, and proceeds only after the answer", async () => {
    let answer: ((value: boolean) => void) | undefined;
    stub.ask.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
    );
    const router = build(true);
    leave();
    await waitFor(() => expect(stub.ask).toHaveBeenCalledTimes(1));
    expect(router.state.location.pathname).toBe("/form");
    await act(async () => {
      answer?.(true);
    });
    await waitFor(() => expect(router.state.location.pathname).toBe("/other"));
    expect(stub.ask).toHaveBeenCalledTimes(1);
  });
});
