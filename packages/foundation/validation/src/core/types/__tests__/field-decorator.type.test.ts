/**
 * Stackra file contract:
 * Purpose: type tests of `FieldDecorator<T>` and `SchemaFieldDecorator<Out>`: the first fits a field of type `T`,
 *          optional or nullable, and refuses any other; the second fits a field that can hold the schema's output.
 * Boundary: test only; the decorators under test record nothing, so no kind is needed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import type { FieldDecorator } from "#core/types/field-decorator.type";
import type { SchemaFieldDecorator } from "#core/types/schema-field-decorator.type";

const seen: string[] = [];
const text: FieldDecorator<string> = (_target, property) => {
  seen.push(property);
};
const flag: SchemaFieldDecorator<true> = (_target, property) => {
  seen.push(property);
};

class Form {
  @text
  name = "";

  @text
  nickname?: string;

  @text
  middle: string | null = null;

  // @ts-expect-error -- a number is not a string
  @text
  age = 0;

  @flag
  consent = false;

  // @ts-expect-error -- the schema yields true, the field holds strings only
  @flag
  label = "";
}

describe("FieldDecorator", () => {
  it("applies to each field it decorates", () => {
    expect(new Form()).toBeInstanceOf(Form);
    expect(seen).toEqual(["name", "nickname", "middle", "age", "consent", "label"]);
  });
});
