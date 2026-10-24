/**
 * Stackra file contract:
 * Purpose: proves the native RouteLeaveConfirmation holds a removal while `when` is true and asks through the
 *          `LeaveConfirmation` handle: Discard replays the held action, Stay drops it, an action that fires while the
 *          question is open is ignored, and the hook is told whether to prevent removal from `when`.
 * Boundary: React Native does not render in vitest, so React Navigation and `LeaveConfirmation` are stand-ins whose
 *           answer the test decides; what reaches them (`when`, the words, the held action) is checked, and the real
 *           dialog is proved by `@stackra/ui`. The Android back button and the iOS swipe are device checks.
 * Runtime: node
 * Governing contract: ADR 0317 (decision 2); ADR 0312; ADR 0022 (test placement); WCAG 2.2 SC 3.3.4.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-183
import { render } from "@testing-library/react";
import { useImperativeHandle, type Ref } from "react";

import { RouteLeaveConfirmation } from "#native/route-leave-confirmation/route-leave-confirmation";

/** What the stand-ins were last given, and how the dialog answers. */
const stub = vi.hoisted(() => ({
  props: {} as Record<string, unknown>,
  ask: vi.fn<() => Promise<boolean>>(),
  dispatch: vi.fn(),
  prevent: undefined as undefined | boolean,
  onPrevented: undefined as undefined | ((event: { data: { action: unknown } }) => void),
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ dispatch: stub.dispatch }),
  usePreventRemove: (
    preventRemove: boolean,
    callback: (event: { data: { action: unknown } }) => void,
  ) => {
    stub.prevent = preventRemove;
    stub.onPrevented = callback;
  },
}));

vi.mock("@stackra/ui/native", () => ({
  LeaveConfirmation: (props: { readonly ref?: Ref<{ confirmLeave: () => Promise<boolean> }> }) => {
    const { ref, ...rest } = props;
    stub.props = rest;
    useImperativeHandle(ref, () => ({ confirmLeave: () => stub.ask() }), []);
    return null;
  },
}));

const ACTION = { type: "GO_BACK" };
const renderGuard = (when: boolean) =>
  render(
    <RouteLeaveConfirmation
      when={when}
      title="Discard?"
      description="Lost."
      stayLabel="Stay"
      discardLabel="Discard"
    />,
  );
const held = () => stub.onPrevented?.({ data: { action: ACTION } });

describe("RouteLeaveConfirmation (native)", () => {
  beforeEach(() => {
    stub.ask.mockReset();
    stub.dispatch.mockReset();
  });

  it("prevents removal exactly while there is unsaved work, and hands LeaveConfirmation its props", () => {
    const view = renderGuard(true);
    expect(stub.prevent).toBe(true);
    expect(stub.props).toMatchObject({ when: true, title: "Discard?", discardLabel: "Discard" });
    view.rerender(
      <RouteLeaveConfirmation
        when={false}
        title="Discard?"
        stayLabel="Stay"
        discardLabel="Discard"
      />,
    );
    expect(stub.prevent).toBe(false);
  });

  it("replays the held action on Discard", async () => {
    stub.ask.mockResolvedValue(true);
    renderGuard(true);
    held();
    await vi.waitFor(() => expect(stub.dispatch).toHaveBeenCalledWith(ACTION));
  });

  it("drops the held action on Stay", async () => {
    stub.ask.mockResolvedValue(false);
    renderGuard(true);
    held();
    await vi.waitFor(() => expect(stub.ask).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(stub.dispatch).not.toHaveBeenCalled();
  });

  it("ignores an action that fires while the question is open", async () => {
    let answer: ((value: boolean) => void) | undefined;
    stub.ask.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
    );
    renderGuard(true);
    held();
    held();
    expect(stub.ask).toHaveBeenCalledTimes(1);
    answer?.(true);
    await vi.waitFor(() => expect(stub.dispatch).toHaveBeenCalledTimes(1));
  });
});
