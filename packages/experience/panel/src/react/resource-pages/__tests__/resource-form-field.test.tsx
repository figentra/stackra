/**
 * Stackra file contract:
 * Purpose: unit tests of `ResourceFormField`'s objects and lists: an object input draws its keys as a titled group; a
 *          list of objects draws a group per row bound by index, labelled without the index, with remove and add; a list
 *          of values adds an empty row; a select's options take their enum labels; a `…Minor` amount is entered in
 *          major units of the record's currency, or in minor units without one.
 * Boundary: unit tier, jsdom; the web kit and the list binding are stand-ins, translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (form keys are input paths).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
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
      readonly name: string;
      readonly value: number | null;
      readonly formatOptions: { readonly currency: string };
      readonly onChange: (value: number) => void;
    }) =>
      createElement(
        "button",
        { type: "button", onClick: () => props.onChange(130.5) },
        `money:${props.name}:${props.value}:${props.formatOptions.currency}`,
      ),
    FormSection: (props: { readonly title: string; readonly children?: ReactNode }) =>
      createElement("fieldset", null, createElement("legend", null, props.title), props.children),
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
});
