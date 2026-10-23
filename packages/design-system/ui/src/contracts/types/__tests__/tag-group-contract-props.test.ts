/**
 * Stackra file contract:
 * Purpose: proves the TagGroup contract is the field contract over a list of keys with the tags required, that a
 *          group with a removal handler must also name its remove buttons and one without may not, and that a tag needs
 *          only a key and a label.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @covers sta-350:FR-080
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { TagGroupContractProps } from "#contracts/types/tag-group-contract-props.type";
import type { TagItem } from "#contracts/types/tag-item.type";

type Remove = (keys: readonly string[]) => void;
type Name = (tagLabel: string) => string;

describe("TagGroupContractProps", () => {
  it("is the field contract over a list of keys, plus the tags", () => {
    expectTypeOf<TagGroupContractProps>().toExtend<FieldContractProps<readonly string[]>>();
    expectTypeOf<TagGroupContractProps["items"]>().toEqualTypeOf<readonly TagItem[]>();
  });

  it("requires the tags and nothing else", () => {
    expectTypeOf<{ items: readonly TagItem[] }>().toExtend<TagGroupContractProps>();
    expectTypeOf<Record<never, never>>().not.toExtend<TagGroupContractProps>();
  });

  it("makes a removal handler bring the name of the remove buttons, and the name need the handler", () => {
    expectTypeOf<{
      items: readonly TagItem[];
      onRemove: Remove;
      removeLabel: Name;
    }>().toExtend<TagGroupContractProps>();
    expectTypeOf<{
      items: readonly TagItem[];
      onRemove: Remove;
    }>().not.toExtend<TagGroupContractProps>();
    expectTypeOf<{
      items: readonly TagItem[];
      removeLabel: Name;
    }>().not.toExtend<TagGroupContractProps>();
  });

  it("needs a tag to have only a key and a label", () => {
    expectTypeOf<{ id: string; label: string }>().toExtend<TagItem>();
    expectTypeOf<{ label: string }>().not.toExtend<TagItem>();
  });
});
