/**
 * Stackra file contract:
 * Purpose: proves the form-field binding copies the name, value and handlers, reads the invalid state and the message
 *          from the field state, and treats the three forms of react-hook-form's `required` rule (`true`, a message, an
 *          object) as required and every other as not required.
 * Boundary: pure function; no library or DOM.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 7); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @covers sta-350:FR-058
import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";
import { bindFormField } from "#core/functions/bind-form-field.function";

const onChange = vi.fn();
const onBlur = vi.fn();
const field = { name: "email", value: "ada", onChange, onBlur };
const valid = { invalid: false };

describe("bindFormField", () => {
  it("copies the name, value and handlers", () => {
    const binding = bindFormField(field, valid);
    expect(binding).toMatchObject({ name: "email", value: "ada", onChange, onBlur });
  });

  it("reads the invalid state and the message from the field state", () => {
    expect(bindFormField(field, valid)).toMatchObject({
      isInvalid: false,
      errorMessage: undefined,
    });
    expect(
      bindFormField(field, { invalid: true, error: { message: "Enter an email" } }),
    ).toMatchObject({ isInvalid: true, errorMessage: "Enter an email" });
  });

  it("reads an empty message, which `rules: { required: true }` gives, as no message", () => {
    expect(
      bindFormField(field, { invalid: true, error: { message: "" } }).errorMessage,
    ).toBeUndefined();
  });

  it("is required for true, a message and an object whose value is true", () => {
    expect(bindFormField(field, valid, true).isRequired).toBe(true);
    expect(bindFormField(field, valid, "Enter an email").isRequired).toBe(true);
    expect(bindFormField(field, valid, { value: true }).isRequired).toBe(true);
  });

  it("is not required without the rule, or when it is switched off", () => {
    expect(bindFormField(field, valid).isRequired).toBe(false);
    expect(bindFormField(field, valid, false).isRequired).toBe(false);
    expect(bindFormField(field, valid, { value: false }).isRequired).toBe(false);
  });

  it("passes the disabled flag through when the form sets it", () => {
    expect(bindFormField({ ...field, disabled: true }, valid).isDisabled).toBe(true);
    expect(bindFormField(field, valid).isDisabled).toBeUndefined();
  });

  it("types: keeps the value type of the field", () => {
    expectTypeOf(bindFormField<boolean>).returns.toEqualTypeOf<FormFieldBinding<boolean>>();
  });
});
