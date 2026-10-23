/**
 * Stackra file contract:
 * Purpose: proves the TextField, TextArea and InputGroup contracts are the field contract over a string, that the area
 *          has no kind of text, and that the group adds a prefix and a suffix.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-063
import type { ReactNode } from "react";

import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { InputGroupContractProps } from "#contracts/types/input-group-contract-props.type";
import type { TextAreaContractProps } from "#contracts/types/text-area-contract-props.type";
import type { TextFieldContractProps } from "#contracts/types/text-field-contract-props.type";

describe("TextFieldContractProps", () => {
  it("is the field contract over a string, with every extra prop optional", () => {
    expectTypeOf<TextFieldContractProps>().toExtend<FieldContractProps<string>>();
    expectTypeOf<TextFieldContractProps["type"]>().toEqualTypeOf<
      "text" | "email" | "password" | "tel" | "url" | undefined
    >();
    expectTypeOf<TextFieldContractProps["variant"]>().toEqualTypeOf<
      "primary" | "secondary" | undefined
    >();
    expectTypeOf<Record<never, never>>().toExtend<TextFieldContractProps>();
  });

  it("gives the text area its rows and no kind of text", () => {
    expectTypeOf<TextAreaContractProps>().toExtend<FieldContractProps<string>>();
    expectTypeOf<TextAreaContractProps["rows"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<TextAreaContractProps>().not.toHaveProperty("type");
  });

  it("gives the input group a prefix and a suffix of any node", () => {
    expectTypeOf<InputGroupContractProps>().toExtend<TextFieldContractProps>();
    expectTypeOf<InputGroupContractProps["prefix"]>().toEqualTypeOf<ReactNode>();
    expectTypeOf<InputGroupContractProps["suffix"]>().toEqualTypeOf<ReactNode>();
  });
});
