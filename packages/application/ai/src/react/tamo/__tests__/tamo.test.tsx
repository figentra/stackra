/**
 * Stackra file contract:
 * Purpose: proves the AI module's side of ADR 0507: the settings resolver (locks win, field over screen over workspace),
 *          the offline mock client (each task's deterministic answer, Stop as an AbortError, failing on purpose), and
 *          `TamoProvider` filling @stackra/ui's TamoContext so a Tamo part draws and runs through the client with the
 *          screen added.
 * Boundary: unit tier, jsdom, the real @stackra/ui parts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0507; ADR 0022.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { TamoContext } from "@stackra/ui/react";
import { cleanup, render, screen } from "@testing-library/react";
import { useContext } from "react";
import { vi } from "vitest";

import { createMockTamoClient } from "#react/tamo/create-mock-tamo-client.function";
import { mockTamoDate } from "#react/tamo/mock-tamo-date.function";
import { mockTamoFilter } from "#react/tamo/mock-tamo-filter.function";
import { mockTamoForm } from "#react/tamo/mock-tamo-form.function";
import { mockTamoText } from "#react/tamo/mock-tamo-text.function";
import { resolveTamoEnabled } from "#react/tamo/resolve-tamo-enabled.function";
import { TamoProvider } from "#react/tamo/tamo-provider";

afterEach(cleanup);

describe("resolveTamoEnabled", () => {
  const settings = {
    isEnabled: true,
    screens: {
      orders: { isEnabled: false, fields: { note: { isEnabled: true } } },
      payroll: { isEnabled: false, isLocked: true, fields: { note: { isEnabled: true } } },
    },
  };

  it("reads the field over the screen over the workspace", () => {
    expect(resolveTamoEnabled(settings)).toBe(true);
    expect(resolveTamoEnabled(settings, "orders")).toBe(false);
    expect(resolveTamoEnabled(settings, "orders", "note")).toBe(true);
    expect(resolveTamoEnabled(settings, "elsewhere", "note")).toBe(true);
  });

  it("lets a locked level win over the levels under it", () => {
    expect(resolveTamoEnabled(settings, "payroll", "note")).toBe(false);
    expect(
      resolveTamoEnabled({ ...settings, isEnabled: false, isLocked: true }, "orders", "note"),
    ).toBe(false);
  });
});

describe("the mock's rules", () => {
  it("does each text action the same way every time", () => {
    expect(mockTamoText("fix_grammar", "hello  world ,i said")).toBe("Hello world, I said.");
    expect(mockTamoText("translate", "Thank you for your order.")).toBe("شكرًا لطلبك.");
    expect(mockTamoText("translate", "شكرًا لطلبك.")).toBe("Thank you for your order.");
    expect(mockTamoText("rewrite", "you will get it")).toBe("You will receive it.");
    expect(mockTamoText("shorten", "One. Two. Three.")).toBe("One.");
  });

  it("reads dates in English and Arabic from today", () => {
    const today = "2026-10-31"; // a Saturday
    const date = (text: string, isRange = false) =>
      mockTamoDate({ text, locale: "en", today, isRange });
    expect(date("tomorrow")).toEqual({ start: "2026-11-01" });
    expect(date("next Friday")).toEqual({ start: "2026-11-06" });
    expect(date("الجمعة القادمة")).toEqual({ start: "2026-11-06" });
    expect(date("last month", true)).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    expect(date("in 2 weeks")).toEqual({ start: "2026-11-14" });
    expect(date("whenever")).toBeNull();
  });

  it("proposes quick-filter conditions and sort keys from words", () => {
    const proposal = mockTamoFilter({
      text: "paid orders over 500, newest first",
      locale: "en",
      columns: [
        { id: "status", label: "Status", type: "choice", options: ["paid", "pending"] },
        { id: "total", label: "Total", type: "number" },
        { id: "placed", label: "Placed", type: "date" },
      ],
    });
    expect(proposal.conditions).toEqual([
      { id: "filter:status", field: "status", operator: "in", value: ["paid"] },
      { id: "filter:total", field: "total", operator: "between", value: ["500", ""] },
    ]);
    expect(proposal.sort).toEqual([{ column: "placed", direction: "descending" }]);
  });

  it("fills form fields from labelled lines and a signature", () => {
    expect(
      mockTamoForm({
        text: "Hi team,\nSara Al-Harbi\nCompany: Nakheel Trading\nCity: Riyadh",
        locale: "en",
        fields: [
          { id: "name", label: "Full name" },
          { id: "company", label: "Company" },
          { id: "city", label: "City" },
        ],
      }),
    ).toEqual({ company: "Nakheel Trading", city: "Riyadh", name: "Sara Al-Harbi" });
  });
});

describe("createMockTamoClient", () => {
  it("answers after its delay with the screen in the context", async () => {
    const client = createMockTamoClient({ delayMs: 1 });
    const answer = await client.run(
      "ask",
      { question: "What needs me?", locale: "en" },
      new AbortController().signal,
      { screen: "Orders" },
    );
    expect(answer).toContain("You're on Orders");
  });

  it("rejects as aborted on Stop and fails the tasks it is told to", async () => {
    const client = createMockTamoClient({ delayMs: 50, failing: ["summarise"] });
    const controller = new AbortController();
    const running = client.run("continue", { text: "Hi", locale: "en" }, controller.signal, {});
    controller.abort();
    await expect(running).rejects.toMatchObject({ name: "AbortError" });
    await expect(
      client.run("summarise", { rows: [], locale: "en" }, new AbortController().signal, {}),
    ).rejects.toThrow(/on purpose/u);
  });
});

/** Shows what the slot says. */
function Probe() {
  const slot = useContext(TamoContext);
  return <p>{slot ? `${String(slot.isEnabled({}))} ${slot.screenLabel ?? ""}` : "none"}</p>;
}

describe("TamoProvider", () => {
  it("fills the slot from the client and the settings", async () => {
    const run = vi.fn(async () => "answer");
    render(
      <TamoProvider client={{ run }} screen="orders" screenLabel="Orders" hasPanel={false}>
        <Probe />
      </TamoProvider>,
    );
    expect(screen.getByText("true Orders")).toBeTruthy();
  });

  it("turns the slot off where the settings say", () => {
    render(
      <TamoProvider
        client={createMockTamoClient()}
        settings={{ isEnabled: true, screens: { orders: { isEnabled: false } } }}
        screen="orders"
        hasPanel={false}
      >
        <Probe />
      </TamoProvider>,
    );
    expect(screen.getByText("false")).toBeTruthy();
  });
});
