/**
 * Stackra file contract:
 * Purpose: proves the web FormField binds real design-system fields to a real react-hook-form form: typing stores the
 *          value, a required rule shows its message on submit and clears it once the value is valid, the required
 *          state and the form's disabled state reach the field, blur marks the field touched, a boolean field and a
 *          choice field bind too, the control can come from `FormProvider`, and the binding is typed to the field.
 * Boundary: jsdom with real HeroUI, React Aria and react-hook-form; the theme CSS is not loaded, so attributes and
 *           messages are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-058 sta-350:FR-059
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";

import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";
import { Checkbox } from "#react/checkbox/checkbox";
import { Form } from "#react/form/form";
import { FormField } from "#react/form-field/form-field";
import type { FormFieldProps } from "#react/form-field/form-field.props";
import { RadioGroup } from "#react/radio-group/radio-group";
import { TextField } from "#react/text-field/text-field";

/** The values of the form under test. */
interface Values {
  email: string;
  agree: boolean;
  plan: string;
}

/** The form handle the last render produced, so a test can read the state react-hook-form holds. */
const latest = vi.hoisted(() => ({ form: undefined as UseFormReturn<Values> | undefined }));

/** A submit handler that ignores the values. */
const ignore = (): undefined => undefined;

/** A form with an email, a boolean and a choice, bound by FormField; `onSubmit` receives the valid values. */
function Harness({
  onSubmit = ignore,
  isDisabled = false,
}: {
  onSubmit?: (values: Values) => void;
  isDisabled?: boolean;
}) {
  const form = useForm<Values>({ defaultValues: { email: "", agree: false, plan: "free" } });
  // An effect, not an assignment in render: the test reads the handle the last committed render produced.
  useEffect(() => {
    latest.form = form;
  });
  return (
    <Form validationBehavior="aria" onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="email"
        disabled={isDisabled}
        rules={{ required: "Enter your email" }}
        render={(binding) => <TextField {...binding} label="Email" />}
      />
      <FormField
        control={form.control}
        name="agree"
        render={(binding) => <Checkbox {...binding} label="I agree" />}
      />
      <FormField
        control={form.control}
        name="plan"
        render={(binding) => (
          <RadioGroup
            {...binding}
            label="Plan"
            options={[
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
            ]}
          />
        )}
      />
      <button type="submit">Save</button>
    </Form>
  );
}

/** A form whose control reaches FormField through `FormProvider`, not a prop. */
function Provided() {
  const form = useForm<Values>({ defaultValues: { email: "ada@example.com" } });
  return (
    <FormProvider {...form}>
      <FormField name="email" render={(binding) => <TextField {...binding} label="Email" />} />
    </FormProvider>
  );
}

describe("FormField (web)", () => {
  it("stores what the user types in the form", () => {
    render(<Harness />);
    fireEvent.change(screen.getByRole("textbox", { name: /Email/ }), {
      target: { value: "ada@example.com" },
    });
    expect(latest.form?.getValues("email")).toBe("ada@example.com");
  });

  it("shows the rule's message on submit and clears it once the value is valid", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: /Email/ });
    expect(screen.queryByText("Enter your email")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const message = await screen.findByText("Enter your email");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "ada@example.com" } });
    await waitFor(() => expect(screen.queryByText("Enter your email")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ email: "ada@example.com" });
  });

  it("tells the field it is required when the rule is", () => {
    render(<Harness />);
    expect(screen.getByRole("textbox", { name: /Email/ }).getAttribute("aria-required")).toBe(
      "true",
    );
  });

  it("disables the field when the form does", () => {
    render(<Harness isDisabled />);
    expect(screen.getByRole("textbox", { name: /Email/ }).hasAttribute("disabled")).toBe(true);
  });

  it("marks the field touched when it loses focus", async () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: /Email/ });
    expect(latest.form?.formState.touchedFields.email).toBeUndefined();
    fireEvent.focus(input);
    fireEvent.blur(input);
    await waitFor(() => expect(latest.form?.formState.touchedFields.email).toBe(true));
  });

  it("binds a boolean field and a choice field", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("checkbox", { name: "I agree" }));
    expect(latest.form?.getValues("agree")).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "Pro" }));
    expect(latest.form?.getValues("plan")).toBe("pro");
  });

  it("takes the control from FormProvider when none is given", () => {
    render(<Provided />);
    expect((screen.getByRole("textbox", { name: "Email" }) as HTMLInputElement).value).toBe(
      "ada@example.com",
    );
  });

  it("types: the binding is typed to the field's value", () => {
    expectTypeOf<FormFieldProps<Values, "agree">["render"]>()
      .parameter(0)
      .toEqualTypeOf<FormFieldBinding<boolean>>();
    expectTypeOf<FormFieldProps<Values, "email">["render"]>()
      .parameter(0)
      .toEqualTypeOf<FormFieldBinding<string>>();
  });
});
