/**
 * Stackra file contract:
 * Purpose: proves the native FormField binds a field to a real react-hook-form form: the field it renders receives the
 *          name, the value, the required, invalid and disabled states and the rule's message, a change reaches the form
 *          and a blur marks the field touched, a failed submit shows the message and a valid one clears it, and the
 *          binding is typed to the field.
 * Boundary: the file imports no native module, so the field is a recording stand-in that renders a DOM input and
 *           shows what it was handed; react-hook-form is real. How a native field draws its error is the field's own
 *           test.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0055 (forms);
 *          ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-058 sta-350:FR-059
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";
import { FormField, type FormFieldProps } from "#native/form-field/form-field";

/** The values of the form under test. */
interface Values {
  email: string;
  agree: boolean;
}

/** The handle the last render produced, and the binding the stand-in field was last given. */
const seen = vi.hoisted(() => ({
  form: undefined as UseFormReturn<Values> | undefined,
  binding: undefined as FormFieldBinding<string> | undefined,
}));

/** A stand-in for a native field: it shows the invalid message and reports changes and blurs through the binding. */
function StandInField({ binding }: { binding: FormFieldBinding<string> }) {
  useEffect(() => {
    seen.binding = binding;
  });
  return (
    <>
      <input
        aria-label="Email"
        value={binding.value ?? ""}
        disabled={binding.isDisabled ?? false}
        onChange={(event) => binding.onChange?.(event.target.value)}
        onBlur={binding.onBlur}
      />
      {binding.isInvalid ? <span>{binding.errorMessage}</span> : null}
    </>
  );
}

/** A form with one required email field bound by FormField. */
function Harness({
  isDisabled = false,
  onSubmit = () => undefined,
}: {
  isDisabled?: boolean;
  onSubmit?: (values: Values) => void;
}) {
  const form = useForm<Values>({ defaultValues: { email: "", agree: false } });
  useEffect(() => {
    seen.form = form;
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="email"
        disabled={isDisabled}
        rules={{ required: "Enter your email" }}
        render={(binding) => <StandInField binding={binding} />}
      />
      <button type="submit">Save</button>
    </form>
  );
}

describe("FormField (native)", () => {
  beforeEach(() => {
    seen.form = undefined;
    seen.binding = undefined;
  });

  it("hands the field its name, value and states", () => {
    render(<Harness />);
    expect(seen.binding).toMatchObject({
      name: "email",
      value: "",
      isRequired: true,
      isInvalid: false,
    });
  });

  it("stores a change in the form and marks the field touched on blur", async () => {
    render(<Harness />);
    const input = screen.getByLabelText("Email");
    // Reading the state first subscribes to it: react-hook-form tracks only the form state a render has read.
    expect(seen.form?.formState.touchedFields.email).toBeUndefined();
    fireEvent.change(input, { target: { value: "ada@example.com" } });
    expect(seen.form?.getValues("email")).toBe("ada@example.com");
    fireEvent.blur(input);
    await waitFor(() => expect(seen.form?.formState.touchedFields.email).toBe(true));
  });

  it("shows the rule's message after a failed submit and clears it once the value is valid", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Enter your email");
    // The binding the field was handed catches up with the message in the render after it.
    await waitFor(() =>
      expect(seen.binding).toMatchObject({ isInvalid: true, errorMessage: "Enter your email" }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    await waitFor(() => expect(screen.queryByText("Enter your email")).toBeNull());
  });

  it("disables the field when the form does", () => {
    render(<Harness isDisabled />);
    expect(seen.binding?.isDisabled).toBe(true);
  });

  it("types: the binding is typed to the field's value", () => {
    expectTypeOf<FormFieldProps<Values, "agree">["render"]>()
      .parameter(0)
      .toEqualTypeOf<FormFieldBinding<boolean>>();
  });
});
