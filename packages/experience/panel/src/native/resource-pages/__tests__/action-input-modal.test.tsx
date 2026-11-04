/**
 * Stackra file contract:
 * Purpose: unit tests of the native `ActionInputModal`: the action's label as the dialog's title and one field per input
 *          key but the id, the record's own values and the id pre-filled, Confirm running the action once per record
 *          with the runner's dialog skipped and then closing, a refusal keeping the modal open for the refused records
 *          only, Cancel closing, nothing drawn while closed, and the form under `dir="rtl"`.
 * Boundary: unit tier, jsdom. `react-native` and `@stackra/ui/native` are DOM stand-ins (the schema form submits the
 *           values a test sets); the action runner is a spy; translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 3); ADR 0164 (native parity).
 */
// @vitest-environment jsdom
import { actionRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import { ActionInputModal } from "#native/resource-pages/action-input-modal";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";

const spies = vi.hoisted(() => ({
  run: vi.fn(),
  useSchemaForm: vi.fn(),
  values: {} as Record<string, unknown>,
}));

vi.mock("@stackra/clients/native", () => ({ useQuery: vi.fn() }));
vi.mock("#native/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: { readonly children?: ReactNode }) => createElement("div", null, props.children),
  };
});

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
  type Props = Record<string, any>;
  const part = (tag: string) => (props: Props) => createElement(tag, null, props.children);
  const field = (kind: string) => (props: Props) =>
    createElement("label", { "data-kind": kind }, `${kind}:${props.name}`);
  return {
    useSchemaForm: (type: unknown, options: unknown) => {
      spies.useSchemaForm(type, options);
      return {
        formState: { isSubmitting: false },
        handleSubmit: (onValid: (values: unknown) => unknown) => async () => onValid(spies.values),
      };
    },
    Modal: Object.assign(
      (props: Props) => createElement("div", { role: "dialog" }, props.children),
      {
        Header: part("header"),
        Title: part("h2"),
        Body: part("div"),
        Footer: part("footer"),
      },
    ),
    Form: part("form"),
    Text: part("p"),
    Field: { Text: field("text"), Number: field("number") },
    Button: (props: Props) =>
      createElement("button", { type: "button", onClick: props.onPress }, props.children),
  };
});

const ReplyReviewAction = actionRef("shop.review.reply@1", {
  input: z.object({ reviewId: z.string(), reply: z.string() }),
  output: z.object({}),
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  spies.values = {};
});

describe("native ActionInputModal", () => {
  it("asks for every input key but the id, pre-filled from the record", () => {
    render(
      <ActionInputModal
        resourceKey="shop.review"
        action={ReplyReviewAction}
        idKey="reviewId"
        ids={["rev_1"]}
        record={{ id: "rev_1", reply: "Thanks" }}
      />,
    );
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "shop::resources.review.actions.reply" }),
    ).toBeDefined();
    expect(screen.getByText("text:reply")).toBeDefined();
    expect(screen.queryByText("text:reviewId")).toBeNull();
    expect(spies.useSchemaForm).toHaveBeenCalledWith(
      ReplyReviewAction,
      expect.objectContaining({ defaultValues: { reply: "Thanks", reviewId: "rev_1" } }),
    );
  });

  it("runs the action once per record without the runner's dialog, then closes", async () => {
    spies.values = { reply: "Thanks" };
    spies.run.mockResolvedValue({ status: ActionRunStatus.Done, data: {} });
    const onOpenChange = vi.fn();
    render(
      <ActionInputModal
        resourceKey="shop.review"
        action={ReplyReviewAction}
        idKey="reviewId"
        ids={["rev_1", "rev_2"]}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "panel::actions.confirm" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(spies.run.mock.calls).toEqual([
      [ReplyReviewAction, { reply: "Thanks", reviewId: "rev_1" }, { confirmed: true }],
      [ReplyReviewAction, { reply: "Thanks", reviewId: "rev_2" }, { confirmed: true }],
    ]);
  });

  it("stays open for the refused records with the server's field errors", async () => {
    spies.values = { reply: "" };
    spies.run
      .mockResolvedValueOnce({ status: ActionRunStatus.Done, data: {} })
      .mockResolvedValueOnce({
        status: ActionRunStatus.Refused,
        error: { fieldErrors: { reply: "too short" } },
      });
    const onOpenChange = vi.fn();
    render(
      <ActionInputModal
        resourceKey="shop.review"
        action={ReplyReviewAction}
        idKey="reviewId"
        ids={["rev_1", "rev_2"]}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "panel::actions.confirm" }));
    await waitFor(() =>
      expect(spies.useSchemaForm).toHaveBeenLastCalledWith(
        ReplyReviewAction,
        expect.objectContaining({ serverErrors: { reply: "too short" } }),
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    spies.run.mockClear();
    spies.run.mockResolvedValue({ status: ActionRunStatus.Done, data: {} });
    fireEvent.click(screen.getByRole("button", { name: "panel::actions.confirm" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(spies.run.mock.calls.map((call) => call[1])).toEqual([{ reply: "", reviewId: "rev_2" }]);
  });

  it("closes on Cancel and draws nothing while closed", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ActionInputModal
        resourceKey="shop.review"
        action={ReplyReviewAction}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "panel::actions.cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(
      <ActionInputModal
        resourceKey="shop.review"
        action={ReplyReviewAction}
        isOpen={false}
        onOpenChange={onOpenChange}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("draws the form right to left", () => {
    render(
      <div dir="rtl">
        <ActionInputModal resourceKey="shop.review" action={ReplyReviewAction} idKey="reviewId" />
      </div>,
    );
    expect(screen.getByText("text:reply")).toBeDefined();
  });
});
