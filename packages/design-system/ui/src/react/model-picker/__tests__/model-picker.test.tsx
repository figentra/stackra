/**
 * Stackra file contract:
 * Purpose: proves the web ModelPicker shows the picked model's name and badge in its trigger, lists the models grouped
 *          by provider with their tags, context size and a disabled model's reason, refuses the disabled one, and
 *          reports the picked id while holding it when uncontrolled.
 * Boundary: jsdom with real HeroUI.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";

import type { AiModel } from "#contracts/types/ai-model.type";
import { ModelPicker } from "#react/model-picker/model-picker";

const press = (element: HTMLElement) => act(() => element.click());

const MODELS: readonly AiModel[] = [
  {
    id: "swift",
    name: "Swift 2",
    provider: "Northwind",
    description: "Quick answers",
    capabilities: ["Fast"],
    contextWindow: 128_000,
  },
  { id: "deep", name: "Deep 4", provider: "Northwind", badge: "new", capabilities: ["Reasoning"] },
  {
    id: "eye",
    name: "Eye 1",
    provider: "Contoso",
    isDisabled: true,
    disabledReason: "On the Business plan",
  },
];

describe("ModelPicker (web)", () => {
  it("shows the picked model and lists the groups", () => {
    render(<ModelPicker models={MODELS} defaultValue="deep" />);
    const trigger = screen.getByRole("button", { name: /Model/ });
    expect(trigger.textContent).toContain("Deep 4");
    expect(trigger.textContent).toContain("New");
    press(trigger);
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByText("Northwind")).toBeTruthy();
    expect(within(listbox).getByText("Contoso")).toBeTruthy();
    expect(within(listbox).getByText("128K context")).toBeTruthy();
    expect(within(listbox).getByText("On the Business plan")).toBeTruthy();
    const eye = within(listbox).getByRole("option", { name: /Eye 1/ });
    expect(eye.getAttribute("aria-disabled")).toBe("true");
  });

  it("reports and holds the picked model", () => {
    const onChange = vi.fn();
    render(
      <ModelPicker
        models={MODELS}
        label="Assistant model"
        isLabelVisible={false}
        onChange={onChange}
      />,
    );
    const trigger = screen.getByRole("button", { name: /Assistant model/ });
    expect(trigger.textContent).toContain("Choose a model");
    press(trigger);
    press(within(screen.getByRole("listbox")).getByRole("option", { name: /Swift 2/ }));
    expect(onChange).toHaveBeenCalledWith("swift");
    expect(screen.getByRole("button", { name: /Assistant model/ }).textContent).toContain(
      "Swift 2",
    );
  });
});
