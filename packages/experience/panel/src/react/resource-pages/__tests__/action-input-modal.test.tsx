/**
 * Stackra file contract:
 * Purpose: unit tests of `ActionInputModal`: it draws the action's label, its confirm copy and one field per key, starts
 *          the form with the record id, submits the values once per record without a second confirmation and closes;
 *          a refusal keeps it open with the server's field errors and retries only the refused records.
 * Boundary: unit tier, jsdom; the action runner and the schema form are spies, the web kit is DOM stand-ins,
 *           translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 3); ADR 0139.
 */
// @vitest-environment jsdom
import { actionRef } from "@stackra/clients";
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import { ActionInputModal } from "#react/resource-pages/action-input-modal";

const spies = vi.hoisted(() => ({
  run: vi.fn(),
  useSchemaForm: vi.fn(),
  values: {} as Record<string, unknown>,
}));

vi.mock("#react/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
  type Props = Record<string, any>;
  const part = (tag: string) => (props: Props) => createElement(tag, null, props.children);
  const field = (kind: string) => (props: Props) =>
    createElement("label", { "data-kind": kind }, `${kind}:${props.name}`);
  return {
    useSchemaForm: (type: unknown, options: unknown) => {
      spies.useSchemaForm(type, options);
      return { formState: { isSubmitting: false } };
    },
    Modal: Object.assign(
      (props: Props) =>
        createElement(
          "dialog",
          { open: true },
          props.children,
          createElement(
            "button",
            { type: "button", onClick: () => props.onOpenChange(false) },
            "x",
          ),
        ),
      {
        Header: part("header"),
        Title: part("h2"),
        Body: part("section"),
        Footer: part("footer"),
      },
    ),
    Form: (props: Props) =>
      createElement(
        "form",
        null,
        props.children,
        createElement(
          "button",
          { type: "button", onClick: () => props.submit(spies.values) },
          "submit",
        ),
      ),
    Text: part("p"),
    Button: part("span"),
    FormSection: part("fieldset"),
    Field: {
      Text: field("text"),
      Number: field("number"),
      Switch: field("switch"),
      Select: field("select"),
      ComboBox: field("combo"),
    },
  };
});

const ModerateReviewAction = actionRef("reviews.review.moderate@1", {
  input: z.object({
    reviewId: z.string(),
    decision: z.enum(["approve", "reject"]),
    note: z.string().optional(),
  }),
  output: z.object({}),
  confirm: "reviews::actions.review.moderate.confirm" as I18nKey,
});

/** Draws the modal over `ids`. */
function open(ids: string[], onClose = vi.fn()) {
  render(
    <ActionInputModal
      resourceKey="reviews.review"
      action={ModerateReviewAction}
      idKey="reviewId"
      ids={ids}
      keys={["decision", "note"]}
      onClose={onClose}
    />,
  );
  return onClose;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  spies.values = {};
});

describe("ActionInputModal", () => {
  it("draws the label, the confirm copy and the fields, started with the record id", () => {
    open(["rev_1"]);
    expect(screen.getByText("reviews::resources.review.actions.moderate")).toBeTruthy();
    expect(screen.getByText("reviews::actions.review.moderate.confirm")).toBeTruthy();
    expect(screen.getByText("select:decision")).toBeTruthy();
    expect(screen.getByText("text:note")).toBeTruthy();
    expect(screen.queryByText("text:reviewId")).toBeNull();
    expect(spies.useSchemaForm.mock.calls[0]?.[1]).toMatchObject({
      defaultValues: { reviewId: "rev_1" },
    });
  });

  it("runs once per record with the same values, confirmed, then closes", async () => {
    spies.run.mockResolvedValue({ status: "done", data: {} });
    spies.values = { reviewId: "rev_1", decision: "reject" };
    const onClose = open(["rev_1", "rev_2"]);
    await act(async () => fireEvent.click(screen.getByText("submit")));
    expect(spies.run).toHaveBeenNthCalledWith(
      1,
      ModerateReviewAction,
      { reviewId: "rev_1", decision: "reject" },
      { confirmed: true },
    );
    expect(spies.run).toHaveBeenNthCalledWith(
      2,
      ModerateReviewAction,
      { reviewId: "rev_2", decision: "reject" },
      { confirmed: true },
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open on a refusal with its field errors and retries only the refused records", async () => {
    spies.run.mockResolvedValueOnce({ status: "done", data: {} }).mockResolvedValueOnce({
      status: "refused",
      error: { fieldErrors: { note: "reviews::errors.note_required" } },
    });
    spies.values = { decision: "reject" };
    const onClose = open(["rev_1", "rev_2"]);
    await act(async () => fireEvent.click(screen.getByText("submit")));
    expect(onClose).not.toHaveBeenCalled();
    expect(spies.useSchemaForm.mock.calls.at(-1)?.[1]).toMatchObject({
      serverErrors: { note: "reviews::errors.note_required" },
    });

    spies.run.mockClear();
    spies.run.mockResolvedValue({ status: "done", data: {} });
    await act(async () => fireEvent.click(screen.getByText("submit")));
    expect(spies.run).toHaveBeenCalledTimes(1);
    expect(spies.run.mock.calls[0]?.[1]).toEqual({ reviewId: "rev_2", decision: "reject" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when dismissed", () => {
    const onClose = open(["rev_1"]);
    fireEvent.click(screen.getByText("x"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
