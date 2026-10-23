/**
 * Stackra file contract:
 * Purpose: proves the native TextArea hands HeroUI Native's root the field's states and the caller's class, draws the
 *          label, area, description and error only when given, maps `onChange` to `onChangeText`, `isReadOnly` to
 *          `readOnly` and `rows` to `numberOfLines`, names the area by a string label, passes the variant,
 *          placeholder and unknown props to the area, keeps `name` off it, and refuses `type`, `fullWidth` and
 *          `onChangeText`.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by recording stand-ins that render
 *           plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-066 sta-350:FR-068
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import type { TextAreaContractProps } from "#contracts/types/text-area-contract-props.type";
import { TextArea, type TextAreaProps } from "#native/text-area/text-area";

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
    TextArea: (props: Record<string, unknown>) => {
      received.props["area"] = props;
      return h("textarea", {
        "data-testid": "area",
        onChange: (event: { target: { value: string } }) =>
          (props["onChangeText"] as ((text: string) => void) | undefined)?.(event.target.value),
      });
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

describe("TextArea (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("draws only the parts it is given", () => {
    render(<TextArea accessibilityLabel="Bare" />);
    expect(screen.getByTestId("area")).toBeTruthy();
    for (const part of ["label", "description", "error"])
      expect(screen.queryByTestId(part), part).toBeNull();
  });

  it("draws the label, the area, the description and the error in that order", () => {
    render(<TextArea label="Message" description="Hint" errorMessage="Wrong" />);
    expect(
      [...screen.getByTestId("root").children].map((node) => node.getAttribute("data-testid")),
    ).toEqual(["label", "area", "description", "error"]);
  });

  it("hands the root the required, invalid and disabled states", () => {
    render(<TextArea label="Message" isRequired isInvalid isDisabled />);
    expect(propsOf("root")).toMatchObject({ isRequired: true, isInvalid: true, isDisabled: true });
  });

  it("hides the description while the field is invalid, as web does", () => {
    render(<TextArea label="Message" description="Hint" />);
    expect(propsOf("description")["hideOnInvalid"]).toBe(true);
  });

  it("names the area by a string label and lets the caller's name win", () => {
    const { unmount } = render(<TextArea label="Message" />);
    expect(propsOf("area")["accessibilityLabel"]).toBe("Message");
    unmount();
    render(<TextArea label="Message" accessibilityLabel="Your message" />);
    expect(propsOf("area")["accessibilityLabel"]).toBe("Your message");
  });

  it("maps the lines, the value, the default, the read-only state and the change handler", () => {
    const onChange = vi.fn();
    render(
      <TextArea
        label="Message"
        rows={5}
        value="Hi"
        defaultValue="Yo"
        isReadOnly
        onChange={onChange}
      />,
    );
    expect(propsOf("area")).toMatchObject({
      numberOfLines: 5,
      value: "Hi",
      defaultValue: "Yo",
      readOnly: true,
    });
    fireEvent.change(screen.getByTestId("area"), { target: { value: "Hi there" } });
    expect(onChange).toHaveBeenCalledWith("Hi there");
  });

  it("is a primary, full-width field by default and passes the variant and placeholder", () => {
    const { unmount } = render(<TextArea label="Message" />);
    expect(propsOf("area")["variant"]).toBe("primary");
    expect(propsOf("root")["className"]).toBe("");
    unmount();
    render(
      <TextArea label="Message" variant="secondary" placeholder="Write" isFullWidth={false} />,
    );
    expect(propsOf("area")).toMatchObject({ variant: "secondary", placeholder: "Write" });
    expect(propsOf("root")["className"]).toBe("self-start");
  });

  it("puts the caller's class on the root, not the area", () => {
    render(<TextArea label="Message" className="mine" />);
    expect(propsOf("root")["className"]).toBe("mine");
    expect(propsOf("area")["className"]).toBeUndefined();
  });

  it("passes unknown props to the area and keeps `name` off it", () => {
    render(<TextArea label="Message" name="message" maxLength={9} testID="field" />);
    expect(propsOf("area")).toMatchObject({ maxLength: 9, testID: "field" });
    expect(propsOf("area")).not.toHaveProperty("name");
  });

  it("matches the shared contract and refuses `type`, `fullWidth` and `onChangeText`", () => {
    expectTypeOf<TextAreaProps>().toExtend<TextAreaContractProps>();
    // @ts-expect-error an area has no kind of text
    createElement(TextArea, { type: "email" });
    // @ts-expect-error `isFullWidth` is the contract's name
    createElement(TextArea, { fullWidth: true });
    // @ts-expect-error `onChange` receives the text, so `onChangeText` is not a second way
    createElement(TextArea, { onChangeText: () => undefined });
  });
});
