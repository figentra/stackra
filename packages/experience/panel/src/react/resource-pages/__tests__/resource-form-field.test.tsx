/**
 * Stackra file contract:
 * Purpose: unit tests of `ResourceFormField`'s objects and lists: an object input draws its keys as a titled group; a
 *          list of objects draws a group per row bound by index, labelled without the index, with remove and add; a list
 *          of values adds an empty row; a select's options take their enum labels; a `…Minor` amount is entered in
 *          major units of the record's currency, or in minor units without one; a money object or a list row's
 *          `…Minor` field follows the currency beside it in the form, which is a pick of ISO codes; a JSON value is
 *          edited as text that submits the parsed value and refuses text that does not parse; a map is edited as key and
 *          value rows; a calendar day is held as `YYYY-MM-DD` and an instant, entered in the viewer's time zone, as
 *          UTC ISO.
 * Boundary: unit tier, jsdom; the web kit and the list binding are stand-ins, translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (form keys are input paths).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { isoDateTime } from "@stackra/validation";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import { ResourceFormField } from "#react/resource-pages/resource-form-field";

const spies = vi.hoisted(() => ({
  lists: {} as Record<string, unknown>,
  onChange: vi.fn(),
}));

vi.mock("@stackra/clients/react", () => ({ useQuery: vi.fn() }));
vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      // The catalogue has the action model's enum labels and no resource-model or field ones.
      if (key.includes("::enums.") && !key.includes(".label_service.")) throw new RangeError(key);
      return values === undefined ? key : `${key} ${JSON.stringify(values)}`;
    },
  }),
}));
vi.mock("@stackra/ui/form", () => ({
  useSchemaField: (name: string) => ({
    name,
    value: spies.lists[name],
    onChange: (value: unknown) => spies.onChange(name, value),
  }),
}));
vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  const { parseDate } = await import("@internationalized/date");
  type FieldProps = { readonly name: string; readonly label: string };
  const field = (kind: string) => (props: FieldProps) =>
    createElement("label", null, `${kind}:${props.name}:${props.label}`);
  return {
    Field: {
      Text: field("text"),
      Number: field("number"),
      Switch: field("switch"),
      Select: (props: FieldProps & { readonly options: readonly { readonly label: string }[] }) =>
        createElement(
          "label",
          null,
          `select:${props.name}:${props.options.map((option) => option.label).join("|")}`,
        ),
      ComboBox: field("combo"),
    },
    NumberField: (props: {
      readonly name?: string;
      readonly label?: string;
      readonly value: number | null;
      readonly formatOptions?: { readonly currency: string };
      readonly onChange: (value: number) => void;
    }) =>
      props.formatOptions === undefined
        ? createElement(
            "label",
            null,
            props.label,
            createElement("input", {
              type: "number",
              value: props.value ?? "",
              onChange: (event: { readonly target: { readonly value: string } }) =>
                props.onChange(event.target.value === "" ? Number.NaN : Number(event.target.value)),
            }),
          )
        : createElement(
            "button",
            { type: "button", onClick: () => props.onChange(130.5) },
            `money:${props.name}:${props.value}:${props.formatOptions.currency}`,
          ),
    DatePicker: (props: {
      readonly label: string;
      readonly value: { readonly toString: () => string } | null;
      readonly onChange: (value: unknown) => void;
    }) =>
      createElement(
        "label",
        null,
        props.label,
        createElement("input", {
          value: props.value?.toString() ?? "",
          onChange: (event: { readonly target: { readonly value: string } }) =>
            props.onChange(event.target.value === "" ? null : parseDate(event.target.value)),
        }),
      ),
    TextField: (props: {
      readonly label: string;
      readonly value: string;
      readonly onChange: (value: string) => void;
    }) =>
      createElement(
        "label",
        null,
        props.label,
        createElement("input", {
          value: props.value,
          onChange: (event: { readonly target: { readonly value: string } }) =>
            props.onChange(event.target.value),
        }),
      ),
    TextAreaField: (props: {
      readonly label: string;
      readonly value: string;
      readonly isInvalid?: boolean;
      readonly errorMessage?: string;
      readonly onChange: (value: string) => void;
    }) =>
      createElement(
        "label",
        null,
        props.label,
        createElement("textarea", {
          value: props.value,
          onChange: (event: { readonly target: { readonly value: string } }) =>
            props.onChange(event.target.value),
        }),
        props.isInvalid === true ? props.errorMessage : null,
      ),
    FormSection: (props: {
      readonly title: string;
      readonly description?: string;
      readonly children?: ReactNode;
    }) =>
      createElement(
        "fieldset",
        null,
        createElement("legend", null, props.title),
        props.description,
        props.children,
      ),
    Button: (props: { readonly onPress?: () => void; readonly children?: ReactNode }) =>
      createElement("button", { type: "button", onClick: props.onPress }, props.children),
  };
});

const BuyLabelInput = z.object({
  shipmentId: z.string(),
  address: z.object({ city: z.string(), zip: z.string() }),
  parcels: z.array(z.object({ weight: z.number() })).min(1),
  tags: z.array(z.string()).optional(),
  service: z.enum(["standard", "express"]),
  mode: z.enum(["live", "test"]),
  handedOverMinor: z.number().int(),
  landedCost: z.object({ minor: z.number().int(), currency: z.string() }),
  lines: z.array(z.object({ sku: z.string(), priceMinor: z.number().int(), currency: z.string() })),
  condition: z.json(),
  fieldMap: z.record(z.string(), z.string()),
  validOn: z.iso.date(),
  startsAt: isoDateTime(),
});

/** Draws the field of `key`, as the buy-label action's modal does over `record`. */
function draw(key: string, record?: object): void {
  render(
    <ResourceFormField
      resourceKey="shipping.shipment"
      schema={BuyLabelInput}
      enumOwner="shipping.label"
      record={record}
      node={{ kind: "value", key }}
    />,
  );
}

/** A map row's key input. */
const keyInput = (row: number): HTMLElement =>
  screen.getByLabelText(`panel::resources.record_key {"number":${row}}`);

/** A map row's value input. */
const valueInput = (row: number): HTMLElement =>
  screen.getByLabelText(`panel::resources.record_value {"number":${row}}`);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  spies.lists = {};
});

describe("ResourceFormField objects and lists", () => {
  it("draws an object's keys as a titled group", () => {
    draw("address");
    expect(screen.getByText("shipping::resources.shipment.fields.address")).toBeTruthy();
    expect(
      screen.getByText("text:address.city:shipping::resources.shipment.fields.address_city"),
    ).toBeTruthy();
    expect(
      screen.getByText("text:address.zip:shipping::resources.shipment.fields.address_zip"),
    ).toBeTruthy();
  });

  it("draws a group per list row bound by index, labelled without it, with remove and add", () => {
    spies.lists = { parcels: [{ weight: 1 }, { weight: 2 }] };
    draw("parcels");
    expect(
      screen.getByText(
        "number:parcels.1.weight:shipping::resources.shipment.fields.parcels_weight",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('panel::resources.remove_item {"number":1}'));
    expect(spies.onChange).toHaveBeenLastCalledWith("parcels", [{ weight: 2 }]);
    fireEvent.click(screen.getByText("panel::resources.add_item"));
    expect(spies.onChange).toHaveBeenLastCalledWith("parcels", [{ weight: 1 }, { weight: 2 }, {}]);
  });

  it("adds an empty row to a list of values", () => {
    draw("tags");
    fireEvent.click(screen.getByText("panel::resources.add_item"));
    expect(spies.onChange).toHaveBeenLastCalledWith("tags", [undefined]);
  });

  it("labels a select's options from the action model's enum, else shows the code", () => {
    draw("service");
    expect(
      screen.getByText(
        "select:service:shipping::enums.label_service.standard|shipping::enums.label_service.express",
      ),
    ).toBeTruthy();
    cleanup();
    draw("mode");
    expect(screen.getByText("select:mode:live|test")).toBeTruthy();
  });

  it("enters a minor-unit amount in major units of the record's currency", () => {
    spies.lists = { handedOverMinor: 12_550 };
    draw("handedOverMinor", { id: "run_1", currency: "SAR" });
    const field = screen.getByText("money:handedOverMinor:125.5:SAR");
    fireEvent.click(field);
    expect(spies.onChange).toHaveBeenLastCalledWith("handedOverMinor", 13_050);
  });

  it("keeps minor units without a known currency", () => {
    draw("handedOverMinor", { id: "run_1" });
    expect(screen.getByText(/^number:handedOverMinor:/)).toBeTruthy();
  });

  it("draws a money object as an amount in major units of its chosen currency, and the currency as a pick", () => {
    spies.lists = { "landedCost.minor": 12_345, "landedCost.currency": "KWD" };
    draw("landedCost");
    expect(screen.getByText("money:landedCost.minor:12.345:KWD")).toBeTruthy();
    expect(screen.getByText(/^combo:landedCost\.currency:/)).toBeTruthy();
  });

  it("enters a list row's minor-unit price in its row's currency", () => {
    spies.lists = { lines: [{}], "lines.0.priceMinor": 500, "lines.0.currency": "SAR" };
    draw("lines");
    fireEvent.click(screen.getByText("money:lines.0.priceMinor:5:SAR"));
    expect(spies.onChange).toHaveBeenLastCalledWith("lines.0.priceMinor", 13_050);
  });

  it("keeps a money object's amount in minor units until a valid currency is chosen", () => {
    spies.lists = { "landedCost.minor": 12_345, "landedCost.currency": "" };
    draw("landedCost");
    expect(screen.getByText(/^number:landedCost\.minor:/)).toBeTruthy();
  });

  it("edits a JSON value as text, submitting the parsed value and refusing text that does not parse", () => {
    spies.lists = { condition: { minQty: 10 } };
    draw("condition");
    const editor = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(JSON.parse(editor.value)).toEqual({ minQty: 10 });
    fireEvent.change(editor, { target: { value: '{ "minQty": 12, "tiers": [1, 2] }' } });
    expect(spies.onChange).toHaveBeenLastCalledWith("condition", { minQty: 12, tiers: [1, 2] });
    expect(screen.queryByText("panel::resources.invalid_json")).toBeNull();
    fireEvent.change(editor, { target: { value: "{ minQty: 12" } });
    expect(spies.onChange).toHaveBeenLastCalledWith("condition", Number.NaN);
    expect(screen.getByText("panel::resources.invalid_json")).toBeTruthy();
  });

  it("edits a map as key and value rows, leaving out a row whose key is empty", () => {
    spies.lists = { fieldMap: { sku: "ITEM_NO" } };
    draw("fieldMap");
    expect((valueInput(1) as HTMLInputElement).value).toBe("ITEM_NO");

    fireEvent.change(keyInput(1), { target: { value: "ean" } });
    expect(spies.onChange).toHaveBeenLastCalledWith("fieldMap", { ean: "ITEM_NO" });
    fireEvent.click(screen.getByText("panel::resources.add_item"));
    expect(spies.onChange).toHaveBeenLastCalledWith("fieldMap", { ean: "ITEM_NO" });
    fireEvent.change(keyInput(2), { target: { value: "qty" } });
    fireEvent.change(valueInput(2), { target: { value: "QTY" } });
    expect(spies.onChange).toHaveBeenLastCalledWith("fieldMap", { ean: "ITEM_NO", qty: "QTY" });
    fireEvent.click(screen.getByText('panel::resources.remove_item {"number":1}'));
    expect(spies.onChange).toHaveBeenLastCalledWith("fieldMap", { qty: "QTY" });
  });

  it("holds a calendar day as YYYY-MM-DD, with no time zone", () => {
    spies.lists = { validOn: "2026-11-01" };
    draw("validOn");
    const picker = screen.getByLabelText("shipping::resources.shipment.fields.valid_on");
    expect((picker as HTMLInputElement).value).toBe("2026-11-01");
    fireEvent.change(picker, { target: { value: "2026-12-24" } });
    expect(spies.onChange).toHaveBeenLastCalledWith("validOn", "2026-12-24");
    fireEvent.change(picker, { target: { value: "" } });
    expect(spies.onChange).toHaveBeenLastCalledWith("validOn", undefined);
  });

  it("enters an instant as a day, hour and minute in the viewer's time zone and holds it as UTC ISO", () => {
    spies.lists = { startsAt: new Date(2026, 10, 1, 9, 30).toISOString() };
    draw("startsAt");
    expect(screen.getByText(/^panel::resources\.time_zone /)).toBeTruthy();
    const day = screen.getByLabelText("panel::resources.date_part") as HTMLInputElement;
    const hour = screen.getByLabelText("panel::resources.hour") as HTMLInputElement;
    const minute = screen.getByLabelText("panel::resources.minute") as HTMLInputElement;
    expect([day.value, hour.value, minute.value]).toEqual(["2026-11-01", "9", "30"]);
    fireEvent.change(minute, { target: { value: "45" } });
    expect(spies.onChange).toHaveBeenLastCalledWith(
      "startsAt",
      new Date(2026, 10, 1, 9, 45).toISOString(),
    );
    fireEvent.change(day, { target: { value: "" } });
    expect(spies.onChange).toHaveBeenLastCalledWith("startsAt", undefined);
  });
});
