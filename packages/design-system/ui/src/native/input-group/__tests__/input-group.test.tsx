/**
 * Stackra file contract:
 * Purpose: proves the native InputGroup draws its prefix before the input and its suffix after it, draws a string or
 *          number affix as muted text that ignores touches and an element as given, hands HeroUI Native's root and
 *          group the field's states, maps `onChange`, `isReadOnly` and `type` as the TextField does, names the input by
 *          a string label, passes the variant, placeholder and unknown props to the input, keeps `name` off it, and
 *          refuses `fullWidth`.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by recording stand-ins that render
 *           plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-069 sta-350:FR-071
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import type { InputGroupContractProps } from "#contracts/types/input-group-contract-props.type";
import { InputGroup, type InputGroupProps } from "#native/input-group/input-group";
import { TEXT_INPUT_TYPE_PROPS } from "#native/text-field/text-field";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement: h } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return h("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    TextField: record("root"),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
    Typography: { Paragraph: record("text") },
    InputGroup: Object.assign(record("group"), {
      Prefix: record("prefix"),
      Suffix: record("suffix"),
      Input: (props: Record<string, unknown>) => {
        received.props["input"] = props;
        return h("input", {
          "data-testid": "input",
          onChange: (event: { target: { value: string } }) =>
            (props["onChangeText"] as ((text: string) => void) | undefined)?.(event.target.value),
        });
      },
    }),
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

describe("InputGroup (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("draws the prefix, the input and the suffix in that order inside the group", () => {
    render(<InputGroup label="Slug" prefix="/" suffix=".html" />);
    expect(
      [...screen.getByTestId("group").children].map((node) => node.getAttribute("data-testid")),
    ).toEqual(["prefix", "input", "suffix"]);
  });

  it("draws only the affixes it is given", () => {
    render(<InputGroup accessibilityLabel="Plain" />);
    expect(screen.queryByTestId("prefix")).toBeNull();
    expect(screen.queryByTestId("suffix")).toBeNull();
    expect(screen.getByTestId("input")).toBeTruthy();
  });

  it("draws a string or number affix as muted text that ignores touches", () => {
    render(<InputGroup label="Price" prefix="$" suffix={3} />);
    expect(screen.getByTestId("prefix").textContent).toBe("$");
    expect(propsOf("prefix")["pointerEvents"]).toBe("none");
    expect(propsOf("prefix")).not.toHaveProperty("isDecorative");
    expect(propsOf("suffix")["pointerEvents"]).toBe("none");
    expect(propsOf("text")).toMatchObject({ type: "body-sm", color: "muted" });
  });

  it("draws an element affix as given and keeps its touches", () => {
    render(<InputGroup label="Password" suffix={<button type="button">Show</button>} />);
    expect(screen.getByRole("button", { name: "Show" })).toBeTruthy();
    expect(screen.queryByTestId("text")).toBeNull();
    expect(propsOf("suffix")).not.toHaveProperty("pointerEvents");
  });

  it("hands the root the required, invalid and disabled states and the group the disabled one", () => {
    render(<InputGroup label="Price" isRequired isInvalid isDisabled />);
    expect(propsOf("root")).toMatchObject({ isRequired: true, isInvalid: true, isDisabled: true });
    expect(propsOf("group")["isDisabled"]).toBe(true);
  });

  it("keeps the group enabled by default, since HeroUI Native's group would otherwise reset the input", () => {
    render(<InputGroup label="Price" />);
    expect(propsOf("group")["isDisabled"]).toBe(false);
  });

  it("draws the label, the description and the error, and hides the description while invalid", () => {
    render(<InputGroup label="Price" description="Hint" errorMessage="Wrong" />);
    expect(
      [...screen.getByTestId("root").children].map((node) => node.getAttribute("data-testid")),
    ).toEqual(["label", "group", "description", "error"]);
    expect(propsOf("description")["hideOnInvalid"]).toBe(true);
  });

  it("names the input by a string label and lets the caller's name win", () => {
    const { unmount } = render(<InputGroup label="Price" />);
    expect(propsOf("input")["accessibilityLabel"]).toBe("Price");
    unmount();
    render(<InputGroup label="Price" accessibilityLabel="Unit price" />);
    expect(propsOf("input")["accessibilityLabel"]).toBe("Unit price");
  });

  it("maps the value, the default, the read-only state, the kind of text and the change handler", () => {
    const onChange = vi.fn();
    render(
      <InputGroup
        label="Site"
        type="url"
        value="a"
        defaultValue="b"
        isReadOnly
        onChange={onChange}
      />,
    );
    expect(propsOf("input")).toMatchObject({
      ...TEXT_INPUT_TYPE_PROPS.url,
      value: "a",
      defaultValue: "b",
      readOnly: true,
    });
    fireEvent.change(screen.getByTestId("input"), { target: { value: "ab" } });
    expect(onChange).toHaveBeenCalledWith("ab");
  });

  it("is a primary, full-width field by default and passes the variant and placeholder", () => {
    const { unmount } = render(<InputGroup label="Price" />);
    expect(propsOf("input")["variant"]).toBe("primary");
    expect(propsOf("root")["className"]).toBe("");
    unmount();
    render(<InputGroup label="Price" variant="secondary" placeholder="0" isFullWidth={false} />);
    expect(propsOf("input")).toMatchObject({ variant: "secondary", placeholder: "0" });
    expect(propsOf("root")["className"]).toBe("self-start");
  });

  it("passes unknown props to the input and keeps `name` off it", () => {
    render(<InputGroup label="Price" name="price" maxLength={7} testID="field" />);
    expect(propsOf("input")).toMatchObject({ maxLength: 7, testID: "field" });
    expect(propsOf("input")).not.toHaveProperty("name");
  });

  it("matches the shared contract and refuses `fullWidth` and `onChangeText`", () => {
    expectTypeOf<InputGroupProps>().toExtend<InputGroupContractProps>();
    // @ts-expect-error `isFullWidth` is the contract's name
    createElement(InputGroup, { fullWidth: true });
    // @ts-expect-error `onChange` receives the text, so `onChangeText` is not a second way
    createElement(InputGroup, { onChangeText: () => undefined });
  });
});
