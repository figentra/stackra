/**
 * Stackra file contract:
 * Purpose: proves the native ModelPicker hands HeroUI Native the picked model, draws it with its badge in the trigger,
 *          lists the provider groups with tags, context size and a disabled model's reason (the item disabled), and
 *          reports and holds the picked id.
 * Boundary: heroui-native, React Native and the house children are recording stand-ins rendering plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { AiModel } from "#contracts/types/ai-model.type";
import { ModelPicker } from "#native/model-picker/model-picker";

const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  items: [] as Record<string, unknown>[],
}));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en" }),
}));
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    if (name === "item") received.items.push(props);
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Select: Object.assign(record("root"), {
      Trigger: record("trigger"),
      TriggerIndicator: record("indicator"),
      Portal: record("portal"),
      Overlay: record("overlay"),
      Content: record("content"),
      ListLabel: record("list-label"),
      Item: record("item"),
      ItemIndicator: record("item-indicator"),
    }),
    Label: record("label"),
    cn: (...names: (string | undefined)[]) => names.filter(Boolean).join(" "),
  };
});
vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", {}, props["children"] as ReactNode),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", {}, props["children"] as ReactNode),
  };
});
vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return {
    Chip: (props: Record<string, unknown>) =>
      createElement("span", {}, props["children"] as ReactNode),
  };
});
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));

const MODELS: readonly AiModel[] = [
  {
    id: "swift",
    name: "Swift 2",
    provider: "Northwind",
    capabilities: ["Fast"],
    contextWindow: 128_000,
  },
  { id: "deep", name: "Deep 4", provider: "Northwind", badge: "beta" },
  {
    id: "eye",
    name: "Eye 1",
    provider: "Contoso",
    isDisabled: true,
    disabledReason: "On the Business plan",
  },
];

describe("ModelPicker (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.items = [];
  });

  it("draws the picked model and the groups", () => {
    const { getByTestId, getAllByTestId } = render(
      <ModelPicker models={MODELS} defaultValue="deep" />,
    );
    expect(received.props["root"]?.["value"]).toEqual({ value: "deep", label: "Deep 4" });
    expect(getByTestId("trigger").textContent).toBe("Deep 4Beta");
    expect(received.props["trigger"]?.["accessibilityLabel"]).toBe("Model: Deep 4");
    expect(getAllByTestId("list-label").map((node) => node.textContent)).toEqual([
      "Northwind",
      "Contoso",
    ]);
    expect(getByTestId("content").textContent).toContain("128K context");
    expect(getByTestId("content").textContent).toContain("On the Business plan");
    expect(received.items.find((item) => item["value"] === "eye")?.["disabled"]).toBe(true);
  });

  it("reports and holds the picked model", () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<ModelPicker models={MODELS} onChange={onChange} />);
    expect(getByTestId("trigger").textContent).toBe("Choose a model");
    const change = (received.props["root"] ?? {})["onValueChange"] as (option: unknown) => void;
    act(() => change({ value: "swift" }));
    expect(onChange).toHaveBeenCalledWith("swift");
    expect(getByTestId("trigger").textContent).toBe("Swift 2");
  });
});
