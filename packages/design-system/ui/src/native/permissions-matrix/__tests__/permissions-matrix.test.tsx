/**
 * Stackra file contract:
 * Purpose: proves the native PermissionsMatrix is a named horizontal scroll with each role's summary, titled groups
 *          as headers, and a read-only mark per cell named by the permission, the role and allowed or not.
 * Boundary: `react-native`, heroui-native, Lucide and the Text are replaced by stand-ins that render plain DOM and
 *           record their props; `useUiText` writes the key and its values.
 * Runtime: node
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { PermissionsMatrix } from "#native/permissions-matrix/permissions-matrix";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  scroll: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    ScrollView: (props: Record<string, unknown>) => {
      state.scroll = props;
      return createElement("div", null, props["children"] as never);
    },
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
  };
});

vi.mock("heroui-native", () => ({ useThemeColor: (name: string) => `color:${name}` }));

vi.mock("lucide-react-native", async () => {
  const { createElement } = await import("react");
  return {
    Check: (props: Record<string, unknown>) =>
      createElement("i", { "data-icon": "check", "data-color": props["color"] }),
    Minus: (props: Record<string, unknown>) =>
      createElement("i", { "data-icon": "minus", "data-color": props["color"] }),
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as never),
  };
});

vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string, values?: Record<string, unknown>) =>
    values
      ? `${key.replace("ui::permissions_matrix.", "")}(${Object.values(values).join("|")})`
      : key,
}));

const ROLES = [
  { id: "cashier", label: "Cashier" },
  { id: "manager", label: "Manager" },
];
const GROUPS = [
  {
    id: "sales",
    label: "Sales",
    permissions: [
      { id: "sell", label: "Sell" },
      { id: "refund", label: "Refund" },
    ],
  },
];

describe("PermissionsMatrix (native)", () => {
  beforeEach(() => {
    state.views = [];
  });

  it("is a named horizontal scroll with each role's summary and group headers", () => {
    render(
      <PermissionsMatrix
        label="Store roles"
        roles={ROLES}
        groups={GROUPS}
        value={{ manager: ["sell"] }}
      />,
    );
    expect(state.scroll).toMatchObject({ horizontal: true, accessibilityLabel: "Store roles" });
    expect(screen.getByText("summary(0|2)")).toBeTruthy();
    expect(screen.getByText("summary(1|2)")).toBeTruthy();
    expect(state.views.filter((props) => props["accessibilityRole"] === "header")).toHaveLength(1);
  });

  it("names each read-only cell by the permission, the role and allowed or not", () => {
    const { container } = render(
      <PermissionsMatrix
        label="Store roles"
        roles={ROLES}
        groups={GROUPS}
        value={{ manager: ["sell"] }}
      />,
    );
    const cells = state.views.filter((props) => props["accessibilityRole"] === "image");
    expect(cells.map((props) => props["accessibilityLabel"])).toEqual([
      "cell_state(Sell|Cashier|ui::permissions_matrix.denied)",
      "cell_state(Sell|Manager|ui::permissions_matrix.allowed)",
      "cell_state(Refund|Cashier|ui::permissions_matrix.denied)",
      "cell_state(Refund|Manager|ui::permissions_matrix.denied)",
    ]);
    expect(container.querySelector('[data-icon="check"]')?.getAttribute("data-color")).toBe(
      "color:success",
    );
  });
});
