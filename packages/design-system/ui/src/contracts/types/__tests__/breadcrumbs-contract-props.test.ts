/**
 * Stackra file contract:
 * Purpose: proves the Breadcrumbs contract is a trail of collection items: each step has an id and a text, and may
 *          have an href and a handler, and the landmark's name is optional.
 * Boundary: type assertions only; they are checked by the typechecker and the test passes at run time.
 * Runtime: node
 * Governing contract: ADR 0313; ADR 0022 (test placement).
 */
// @covers sta-350:FR-141
import type { BreadcrumbItem } from "#contracts/types/breadcrumb-item.type";
import type { BreadcrumbsContractProps } from "#contracts/types/breadcrumbs-contract-props.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";

describe("BreadcrumbsContractProps", () => {
  it("is a list of items, each a collection item with a text", () => {
    expectTypeOf<BreadcrumbItem>().toExtend<CollectionItem>();
    expectTypeOf<BreadcrumbsContractProps["items"]>().toEqualTypeOf<readonly BreadcrumbItem[]>();
    expectTypeOf<BreadcrumbItem["label"]>().toEqualTypeOf<string>();
  });

  it("needs only an id and a label for a step, and a name is optional", () => {
    expectTypeOf<{ id: string; label: string }>().toExtend<BreadcrumbItem>();
    expectTypeOf<{ items: readonly BreadcrumbItem[] }>().toExtend<BreadcrumbsContractProps>();
    expectTypeOf<BreadcrumbItem["href"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<BreadcrumbItem["onPress"]>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<BreadcrumbsContractProps["label"]>().toEqualTypeOf<string | undefined>();
  });
});
