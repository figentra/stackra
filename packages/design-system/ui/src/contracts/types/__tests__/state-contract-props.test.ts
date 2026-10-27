/**
 * Stackra file contract:
 * Purpose: proves the state-page contracts: the three tuples hold the values of ADR 0313, EmptyState and ErrorState
 *          extend the shared state props with `reason` or `kind`, the title is the one required prop of either, a retry
 *          is a label with its handler, PageSkeleton requires its loading label, and none of them takes `variant`.
 * Boundary: type assertions plus the frozen tuples; the type checks run in the typechecker and pass at run time.
 * Runtime: node
 * Governing contract: ADR 0313 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-350:FR-147
import type { ReactNode } from "react";

import { EmptyReason } from "#contracts/enums/empty-reason.enum";
import { ErrorStateKind } from "#contracts/enums/error-state-kind.enum";
import { PageSkeletonLayout } from "#contracts/enums/page-skeleton-layout.enum";
import type { EmptyStateContractProps } from "#contracts/types/empty-state-contract-props.type";
import type { ErrorStateContractProps } from "#contracts/types/error-state-contract-props.type";
import type { PageSkeletonContractProps } from "#contracts/types/page-skeleton-contract-props.type";
import type { StateContractProps } from "#contracts/types/state-contract-props.type";

describe("state page contracts", () => {
  it("names the reasons, kinds and layouts of ADR 0313, frozen", () => {
    expect(EmptyReason).toEqual(["no-data", "no-results", "permission-denied"]);
    expect(ErrorStateKind).toEqual(["unauthenticated", "forbidden", "not-found", "unexpected"]);
    expect(PageSkeletonLayout).toEqual(["page", "table", "section", "form"]);
    for (const tuple of [EmptyReason, ErrorStateKind, PageSkeletonLayout])
      expect(Object.isFrozen(tuple)).toBe(true);
  });

  it("extends the shared state props with the word that says why", () => {
    expectTypeOf<EmptyStateContractProps>().toExtend<StateContractProps>();
    expectTypeOf<ErrorStateContractProps>().toExtend<StateContractProps>();
    expectTypeOf<EmptyStateContractProps["reason"]>().toEqualTypeOf<EmptyReason | undefined>();
    expectTypeOf<ErrorStateContractProps["kind"]>().toEqualTypeOf<ErrorStateKind | undefined>();
  });

  it("requires only the title, and takes the rest as optional", () => {
    expectTypeOf<StateContractProps["title"]>().toEqualTypeOf<ReactNode>();
    expectTypeOf<{ title: string }>().toExtend<EmptyStateContractProps>();
    expectTypeOf<{ title: string }>().toExtend<ErrorStateContractProps>();
    expectTypeOf<Record<never, never>>().not.toExtend<EmptyStateContractProps>();
  });

  it("takes a retry as a label with what it runs", () => {
    expectTypeOf<ErrorStateContractProps["retry"]>().toEqualTypeOf<
      { readonly label: string; readonly onPress: () => void } | undefined
    >();
  });

  it("requires the loading label of a page skeleton", () => {
    expectTypeOf<PageSkeletonContractProps["loadingLabel"]>().toEqualTypeOf<string>();
    expectTypeOf<Record<never, never>>().not.toExtend<PageSkeletonContractProps>();
    expectTypeOf<{ loadingLabel: string }>().toExtend<PageSkeletonContractProps>();
  });

  it("leaves `variant` to emphasis: no state page has one", () => {
    expectTypeOf<EmptyStateContractProps>().not.toHaveProperty("variant");
    expectTypeOf<ErrorStateContractProps>().not.toHaveProperty("variant");
    expectTypeOf<PageSkeletonContractProps>().not.toHaveProperty("variant");
  });
});
