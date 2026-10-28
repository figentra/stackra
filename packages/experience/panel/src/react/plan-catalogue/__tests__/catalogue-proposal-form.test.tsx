/**
 * Stackra file contract:
 * Purpose: unit tests of `CatalogueProposalForm`: it proposes the edited rows from the earliest allowed day (tomorrow
 *          in the tenant's zone), marks a lowered price as a discount on its own, and refuses rows the kind's reader
 *          rejects, showing why.
 * Boundary: unit tier, jsdom; the web kit is DOM stand-ins (the date picker shows its value and reports nothing),
 *           translation returns the key with its values; the readers are the real ones.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0391 (decisions 2 to 5); owner OS-82, OS-381.
 */
// @vitest-environment jsdom
import { today } from "@internationalized/date";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { CatalogueProposalForm } from "#react/plan-catalogue/catalogue-proposal-form";

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
  const field = (props: Props) =>
    createElement("input", {
      "aria-label": props["label"],
      value: String(props["value"] ?? ""),
      readOnly: props["isReadOnly"],
      onChange: (event: { target: { value: string } }) =>
        (props["onChange"] as (value: unknown) => void)(
          typeof props["value"] === "number" ? Number(event.target.value) : event.target.value,
        ),
    });
  return {
    Card: Object.assign(box("section"), {
      Header: box("header"),
      Title: box("h2"),
      Description: box("p"),
      Content: box("div"),
    }),
    Alert: (props: Props) => createElement("p", { role: "alert" }, props["title"] as ReactNode),
    Text: box("p"),
    TextField: field,
    NumberField: field,
    DatePicker: (props: Props) =>
      createElement("output", { "aria-label": props["label"] }, String(props["value"])),
    Switch: (props: Props) =>
      createElement("input", {
        type: "checkbox",
        "aria-label": props["label"],
        checked: Boolean(props["value"]),
        disabled: props["isDisabled"],
        onChange: (event: { target: { checked: boolean } }) =>
          (props["onChange"] as (value: boolean) => void)(event.target.checked),
      }),
    Button: (props: Props) =>
      createElement(
        "button",
        {
          type: props["type"] === "submit" ? "submit" : "button",
          disabled: props["isDisabled"],
          onClick: props["onPress"] as () => void,
        },
        props.children,
      ),
  };
});

afterEach(cleanup);

const PRICES = [
  { id: 1, regionalTier: "gcc", currency: "SAR", tier: "pro", period: "month", amount: "199.00" },
];

/** Renders the price-list form with a spy for proposals. */
function renderForm() {
  const onPropose = vi.fn();
  render(
    <CatalogueProposalForm
      recordKey="price-list:commerce"
      kind="price-list"
      current={PRICES}
      timeZone="Asia/Riyadh"
      onPropose={onPropose}
    />,
  );
  return onPropose;
}

describe("CatalogueProposalForm", () => {
  it("proposes the rows from tomorrow in the tenant's zone", () => {
    const onPropose = renderForm();
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "249.00" } });
    fireEvent.click(screen.getByRole("button", { name: "panel::plan_catalogue.submit" }));
    expect(onPropose).toHaveBeenCalledWith({
      key: "price-list:commerce",
      kind: "price-list",
      rows: [{ ...PRICES[0], amount: "249.00" }],
      effectiveFrom: today("Asia/Riyadh").add({ days: 1 }).toDate("Asia/Riyadh"),
      discount: false,
    });
  });

  it("marks a lowered price as a discount, which the admin cannot unmark", () => {
    const onPropose = renderForm();
    fireEvent.change(screen.getByLabelText("amount"), { target: { value: "149.00" } });
    const mark = screen.getByLabelText("panel::plan_catalogue.mark_discount") as HTMLInputElement;
    expect(mark.checked).toBe(true);
    expect(mark.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "panel::plan_catalogue.submit" }));
    expect(onPropose.mock.lastCall?.[0]).toMatchObject({ discount: true });
  });

  it("refuses rows the reader rejects and says why", () => {
    const onPropose = renderForm();
    fireEvent.change(screen.getByLabelText("period"), { target: { value: "fortnight" } });
    expect(screen.getByRole("alert").textContent).toContain("unknown period fortnight");
    fireEvent.click(screen.getByRole("button", { name: "panel::plan_catalogue.submit" }));
    expect(onPropose).not.toHaveBeenCalled();
  });
});
