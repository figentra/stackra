/**
 * Stackra file contract:
 * Purpose: unit tests of `ResourceValue`: a flag is a localised yes or no, an enum code takes its named label, else the
 *          first derived label the catalogue has, else shows as its code; free text and money are unchanged.
 * Boundary: unit tier, jsdom; translation reads a small catalogue and throws on a missing key as the real one does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 decision 22; ADR 0307.
 */
// @vitest-environment jsdom
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render } from "@testing-library/react";
import { vi } from "vitest";

import { ResourceValue } from "#react/resource-pages/resource-value";

vi.mock("@stackra/i18n/react", () => {
  const catalogue: Record<string, string> = {
    "panel::resources.yes": "Yes",
    "panel::resources.no": "No",
    "orders::enums.order_status.paid": "Paid",
    "orders::enums.channel.web": "Online",
    "commerce_packs::enums.provider_mode.live": "Live",
  };
  return {
    useTranslation: () => ({
      t: (key: string) => {
        const message = catalogue[key];
        if (message === undefined) throw new RangeError(`No message for "${key}"`);
        return message;
      },
    }),
    useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
  };
});

/** The text `ResourceValue` draws for `props`. */
function shown(props: Partial<Parameters<typeof ResourceValue>[0]>): string | null {
  const { container } = render(
    <ResourceValue
      resourceKey="orders.order"
      path="status"
      kind="value"
      value={undefined}
      {...props}
    />,
  );
  const text = container.textContent;
  cleanup();
  return text;
}

afterEach(() => cleanup());

describe("ResourceValue", () => {
  it("draws a flag as a localised yes or no", () => {
    expect(shown({ path: "isGift", value: true })).toBe("Yes");
    expect(shown({ path: "isGift", value: false })).toBe("No");
  });

  it("draws an enum code by the model's field label, then the field's", () => {
    expect(shown({ value: "paid" })).toBe("Paid");
    expect(shown({ path: "channel", value: "web" })).toBe("Online");
  });

  it("draws the named label of an enum another module declares", () => {
    const labels = { live: "commerce_packs::enums.provider_mode.live" as I18nKey };
    expect(shown({ path: "mode", value: "live", labels })).toBe("Live");
  });

  it("shows a code without a label, free text and money as before", () => {
    expect(shown({ value: "refunded" })).toBe("refunded");
    expect(shown({ path: "note", value: "Leave at the door" })).toBe("Leave at the door");
    expect(shown({ kind: "money", path: "totalMinor", value: 1250, currency: "SAR" })).toBe(
      "SAR 1250",
    );
  });
});
