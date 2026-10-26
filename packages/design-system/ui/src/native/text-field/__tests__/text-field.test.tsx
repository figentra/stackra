/**
 * Stackra file contract:
 * Purpose: proves the native TextField hands HeroUI Native's root the field's states and the caller's class, draws the
 *          label, input, description and error only when given, maps `onChange` to `onChangeText`, `isReadOnly` to
 *          `readOnly` and each `type` to its keyboard and masking, names the input by a string label, passes the
 *          variant, placeholder and unknown props to the input, keeps `name` off it, and refuses `fullWidth` and a
 *          wrong kind of text.
 * Boundary: React Native does not render in vitest, so heroui-native is replaced by recording stand-ins that render
 *           plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-063 sta-350:FR-065
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

import { TextFieldType } from "#contracts/enums/text-field-type.enum";
import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";
import { TextField } from "#native/text-field/text-field";
import { TEXT_INPUT_TYPE_PROPS } from "#native/text-field/text-input-type-props.constant";
import type { TextFieldProps } from "#native/text-field/text-field.props";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement: h } = await import("react");
  const record =
    (name: string, tag = "div") =>
    (props: Record<string, unknown>) => {
      received.props[name] = props;
      return h(tag, { "data-testid": name }, props["children"] as ReactNode);
    };
  return {
    TextField: record("root"),
    Label: record("label"),
    Description: record("description"),
    FieldError: record("error"),
    Input: (props: Record<string, unknown>) => {
      received.props["input"] = props;
      return h("input", {
        "data-testid": "input",
        onChange: (event: { target: { value: string } }) =>
          (props["onChangeText"] as ((text: string) => void) | undefined)?.(event.target.value),
      });
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

describe("TextField (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("draws only the parts it is given", () => {
    render(<TextField accessibilityLabel="Bare" />);
    expect(screen.getByTestId("input")).toBeTruthy();
    for (const part of ["label", "description", "error"])
      expect(screen.queryByTestId(part), part).toBeNull();
  });

  it("draws the label, the input, the description and the error in that order", () => {
    render(<TextField label="Email" description="Hint" errorMessage="Wrong" />);
    expect(
      [...screen.getByTestId("root").children].map((n) => n.getAttribute("data-testid")),
    ).toEqual(["label", "input", "description", "error"]);
    expect(screen.getByTestId("label").textContent).toBe("Email");
    expect(screen.getByTestId("description").textContent).toBe("Hint");
    expect(screen.getByTestId("error").textContent).toBe("Wrong");
  });

  it("hands the root the required, invalid and disabled states", () => {
    render(<TextField label="Name" isRequired isInvalid isDisabled />);
    expect(propsOf("root")).toMatchObject({ isRequired: true, isInvalid: true, isDisabled: true });
  });

  it("hides the description while the field is invalid, as web does", () => {
    render(<TextField label="Name" description="Hint" />);
    expect(propsOf("description")["hideOnInvalid"]).toBe(true);
  });

  it("names the input by a string label and lets the caller's name win", () => {
    const { unmount } = render(<TextField label="Email" />);
    expect(propsOf("input")["accessibilityLabel"]).toBe("Email");
    unmount();
    render(<TextField label="Email" accessibilityLabel="Work email" />);
    expect(propsOf("input")["accessibilityLabel"]).toBe("Work email");
  });

  it("leaves the input unnamed by an element label", () => {
    render(<TextField label={<b>Email</b>} />);
    expect(propsOf("input")["accessibilityLabel"]).toBeUndefined();
  });

  it("maps the value, the default, the read-only state and the change handler", () => {
    const onChange = vi.fn();
    render(
      <TextField label="Name" value="Ada" defaultValue="Bea" isReadOnly onChange={onChange} />,
    );
    expect(propsOf("input")).toMatchObject({ value: "Ada", defaultValue: "Bea", readOnly: true });
    fireEvent.change(screen.getByTestId("input"), { target: { value: "Ada L" } });
    expect(onChange).toHaveBeenCalledWith("Ada L");
  });

  it("is a primary, full-width field by default and passes the variant and placeholder", () => {
    const { unmount } = render(<TextField label="Name" />);
    expect(propsOf("input")["variant"]).toBe("primary");
    expect(propsOf("root")["className"]).toBe("");
    unmount();
    render(
      <TextField label="Name" variant="secondary" placeholder="Your name" isFullWidth={false} />,
    );
    expect(propsOf("input")).toMatchObject({ variant: "secondary", placeholder: "Your name" });
    expect(propsOf("root")["className"]).toBe("self-start");
  });

  it("puts the caller's class on the root, not the input", () => {
    render(<TextField label="Name" className="mine" isFullWidth={false} />);
    expect(propsOf("root")["className"]).toBe("self-start mine");
    expect(propsOf("input")["className"]).toBeUndefined();
  });

  it.each(TextFieldType)("maps the kind of text %s to its keyboard props", (type) => {
    render(<TextField label="Kind" type={type} />);
    expect(propsOf("input")).toMatchObject(TEXT_INPUT_TYPE_PROPS[type]);
  });

  it("masks a password, and asks for the email and phone keyboards", () => {
    expect(TEXT_INPUT_TYPE_PROPS.password.secureTextEntry).toBe(true);
    expect(TEXT_INPUT_TYPE_PROPS.email.keyboardType).toBe("email-address");
    expect(TEXT_INPUT_TYPE_PROPS.tel.keyboardType).toBe("phone-pad");
    expect(TEXT_INPUT_TYPE_PROPS.url.keyboardType).toBe("url");
    expect(TEXT_INPUT_TYPE_PROPS.text).toEqual({});
  });

  it("lets a caller's own keyboard win over the kind's", () => {
    render(<TextField label="Code" type="email" keyboardType="numeric" />);
    expect(propsOf("input")["keyboardType"]).toBe("numeric");
  });

  it("passes unknown props to the input and keeps `name` off it", () => {
    render(<TextField label="Name" name="fullName" maxLength={5} testID="field" />);
    expect(propsOf("input")).toMatchObject({ maxLength: 5, testID: "field" });
    expect(propsOf("input")).not.toHaveProperty("name");
    expect(propsOf("root")).not.toHaveProperty("name");
  });

  it("matches the shared contract and refuses `fullWidth`, `onChangeText` and a wrong kind of text", () => {
    expectTypeOf<TextFieldProps>().toExtend<TextFieldContractProps>();
    // @ts-expect-error `isFullWidth` is the contract's name
    createElement(TextField, { fullWidth: true });
    // @ts-expect-error `onChange` receives the text, so `onChangeText` is not a second way
    createElement(TextField, { onChangeText: () => undefined });
    // @ts-expect-error a kind of text is one of the contract's
    createElement(TextField, { type: "number" });
  });
});
