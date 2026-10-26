/**
 * Stackra file contract:
 * Purpose: unit tests of `OnboardingChecklist`: the progress reads done of total (or all done), each step shows its
 *          translated label and opens, completes, hides and moves through its handlers, and a locked step says it is
 *          required and offers neither hide nor move.
 * Boundary: unit tier, jsdom; the web kit is DOM stand-ins, translation returns the key with its values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0424 (decisions 1 and 2); owner RV-22.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { OnboardingChecklist } from "#react/onboarding-checklist/onboarding-checklist";

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
  }),
}));
vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  type Props = Record<string, unknown> & { readonly children?: ReactNode };
  const box = (tag: string) => (props: Props) => createElement(tag, null, props.children);
  return {
    Card: Object.assign(box("section"), {
      Header: box("header"),
      Title: box("h2"),
      Description: box("p"),
      Content: box("div"),
    }),
    Text: box("p"),
    Icon: () => null,
    ProgressBar: (props: Props) =>
      createElement("progress", {
        "aria-label": props["label"],
        value: props["value"],
        max: props["maxValue"],
      }),
    Button: (props: Props) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props.children,
      ),
    IconButton: (props: Props) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"],
        disabled: props["isDisabled"],
        onClick: props["onPress"] as () => void,
      }),
  };
});

afterEach(cleanup);

const VIEW = {
  key: "workflow-template:commerce:onboarding",
  steps: [
    {
      key: "add_products",
      label: "commerce::onboarding.add_products",
      locked: true,
      route: "products.index",
      done: true,
    },
    {
      key: "invite_staff",
      label: "commerce::onboarding.invite_staff",
      locked: false,
      route: "staff.index",
      done: false,
    },
  ],
  done: 1,
  complete: false,
};

describe("OnboardingChecklist", () => {
  it("reads the progress and each step's label", () => {
    render(<OnboardingChecklist view={VIEW} />);
    expect(
      screen.getAllByText('panel::checklist.progress {"done":1,"total":2}').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("commerce::onboarding.invite_staff")).toBeTruthy();
  });

  it("opens, completes, moves and hides an unlocked step", () => {
    const handlers = { onOpen: vi.fn(), onComplete: vi.fn(), onHide: vi.fn(), onMove: vi.fn() };
    const { container } = render(<OnboardingChecklist view={VIEW} {...handlers} />);
    const step = within(container.querySelector('[data-step="invite_staff"]') as HTMLElement);
    fireEvent.click(step.getByRole("button", { name: "panel::checklist.open" }));
    fireEvent.click(step.getByRole("button", { name: "panel::checklist.mark_done" }));
    fireEvent.click(step.getByRole("button", { name: /panel::checklist.move_up/ }));
    fireEvent.click(step.getByRole("button", { name: /panel::checklist.hide/ }));
    expect(handlers.onOpen).toHaveBeenCalledWith("staff.index");
    expect(handlers.onComplete).toHaveBeenCalledWith("invite_staff");
    expect(handlers.onMove).toHaveBeenCalledWith("invite_staff", -1);
    expect(handlers.onHide).toHaveBeenCalledWith("invite_staff");
  });

  it("offers no hide or move on a locked step and says it is required", () => {
    const { container } = render(
      <OnboardingChecklist view={VIEW} onHide={vi.fn()} onMove={vi.fn()} onComplete={vi.fn()} />,
    );
    const step = within(container.querySelector('[data-step="add_products"]') as HTMLElement);
    expect(step.getByText("panel::checklist.locked")).toBeTruthy();
    expect(step.queryByRole("button", { name: /hide|move/ })).toBeNull();
    expect(step.queryByRole("button", { name: "panel::checklist.mark_done" })).toBeNull();
  });
});
