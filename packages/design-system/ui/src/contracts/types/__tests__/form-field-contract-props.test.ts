/**
 * Stackra file contract:
 * Purpose: proves the form-field binding is a slice of the field contract with a required name and a blur handler, that
 *          every field contract accepts it, and that FormField's props take react-hook-form's options and a render
 *          function typed to the field's value.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 7); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @covers sta-350:FR-058 sta-350:FR-060
import type { ReactElement } from "react";

import type { CheckboxContractProps } from "#contracts/types/checkbox-contract-props.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { FormFieldBinding } from "#contracts/types/form-field-binding.type";
import type { FormFieldContractProps } from "#contracts/types/form-field-contract-props.type";
import type { FormSectionContractProps } from "#contracts/types/form-section-contract-props.type";
import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";

/** A form used to type the field paths. */
interface Values {
  email: string;
  agree: boolean;
}

describe("FormFieldBinding", () => {
  it("is a slice of the field contract with a required name and a blur handler", () => {
    expectTypeOf<FormFieldBinding<string>>().toExtend<
      Pick<FieldContractProps<string>, "value" | "onChange" | "isInvalid" | "errorMessage">
    >();
    expectTypeOf<FormFieldBinding<string>["name"]>().toEqualTypeOf<string>();
    expectTypeOf<FormFieldBinding<string>["onBlur"]>().toEqualTypeOf<() => void>();
  });

  it("is accepted by every field of the same value type", () => {
    expectTypeOf<FormFieldBinding<string>>().toExtend<TextFieldContractProps>();
    expectTypeOf<FormFieldBinding<boolean>>().toExtend<CheckboxContractProps>();
  });
});

describe("FormFieldContractProps", () => {
  it("types the render function's binding by the field's path", () => {
    expectTypeOf<FormFieldContractProps<Values, "email">["render"]>().toEqualTypeOf<
      (binding: FormFieldBinding<string>) => ReactElement
    >();
    expectTypeOf<FormFieldContractProps<Values, "agree">["render"]>()
      .parameter(0)
      .toEqualTypeOf<FormFieldBinding<boolean>>();
  });

  it("takes only the paths of the form", () => {
    expectTypeOf<FormFieldContractProps<Values, "email">["name"]>().toEqualTypeOf<"email">();
  });
});

describe("FormSectionContractProps", () => {
  it("needs a title and takes a description and children", () => {
    expectTypeOf<FormSectionContractProps>().toHaveProperty("title");
    expectTypeOf<{ title: string }>().toExtend<FormSectionContractProps>();
    expectTypeOf<Record<never, never>>().not.toExtend<FormSectionContractProps>();
  });
});
