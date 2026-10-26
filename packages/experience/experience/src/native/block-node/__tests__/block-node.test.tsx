/**
 * Stackra file contract:
 * Purpose: unit tests of the native `BlockNode`: the component gets the node's props, an `onEvent` that hands an action
 *          verb to the screen's `onAction`, and its drawn children; a block that accepts a query shows a Skeleton
 *          while it loads and gets the answer as `data`.
 * Boundary: test only, jsdom. React Native does not load in vitest, so the test components draw DOM elements and
 *           `useQuery` and `@stackra/ui/native` are stand-ins.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decisions 2 and 3); ADR 0112 (X9).
 */
// @vitest-environment jsdom
import { queryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import type { BlockEvent } from "#contracts/types/block-event.type";
import { Block } from "#core/bases/block.base";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { ResolvedNode } from "#core/types/resolved-node.type";
import { BlockNode } from "#native/block-node/block-node";

/** The answer the stand-in `useQuery` returns. */
const answer = vi.hoisted(() => ({
  current: { data: undefined as unknown, error: null as unknown },
}));

vi.mock("@stackra/clients/react", () => ({ useQuery: vi.fn(() => answer.current) }));

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  return { Skeleton: () => createElement("div", { "data-testid": "skeleton" }) };
});

class OrderKpisQuery extends queryRef("orders.order.kpis@1", {
  input: z.object({}),
  output: z.object({ count: z.number() }),
}) {}

class PromoBannerBlock extends Block({
  category: BlockCategory.Marketing,
  icon: "megaphone",
}) {}

class KpiBlock extends Block({
  category: BlockCategory.Commerce,
  icon: "receipt",
  accepts: OrderKpisQuery,
}) {}

/** A banner whose button raises an action verb. */
function PromoBanner(props: {
  readonly headline: string;
  readonly onEvent: (event: BlockEvent) => void;
  readonly children?: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => props.onEvent({ verb: "action", key: "orders.order.create@1" })}
      >
        {props.headline}
      </button>
      {props.children}
    </div>
  );
}

/** A KPI tile drawing the accepted query's count. */
function Kpi(props: { readonly data: { readonly count: number } }) {
  return <p>{`${props.data.count} orders`}</p>;
}

/** A checked node of `block`. */
const nodeOf = (
  block: typeof PromoBannerBlock | typeof KpiBlock,
  component: unknown,
  props: Readonly<Record<string, unknown>>,
  children: readonly ResolvedNode[] = [],
): ResolvedNode => ({
  path: "0",
  entry: { key: "mobile.block", block, component },
  props,
  accepts: block === KpiBlock ? OrderKpisQuery : null,
  input: {},
  children,
});

afterEach(() => {
  cleanup();
  answer.current = { data: undefined, error: null };
});

describe("BlockNode (native)", () => {
  it("hands an action verb to the screen's onAction and draws the children", () => {
    const onAction = vi.fn();
    const child = {
      ...nodeOf(PromoBannerBlock, PromoBanner, { headline: "Inner" }),
      path: "0.children.0",
    };
    render(
      <BlockNode
        node={nodeOf(PromoBannerBlock, PromoBanner, { headline: "Ramadan offers" }, [child])}
        context={{ locale: "ar", onAction }}
      />,
    );
    expect(screen.getByRole("button", { name: "Inner" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ramadan offers" }));
    expect(onAction).toHaveBeenCalledWith({ verb: "action", key: "orders.order.create@1" });
  });

  it("shows a Skeleton while the accepted query loads, then draws its answer as data", () => {
    const node = nodeOf(KpiBlock, Kpi, {});
    const { rerender } = render(<BlockNode node={node} context={{ locale: "en" }} />);
    expect(screen.getByTestId("skeleton")).toBeTruthy();
    answer.current = { data: { count: 7 }, error: null };
    rerender(<BlockNode node={node} context={{ locale: "en" }} />);
    expect(screen.getByText("7 orders")).toBeTruthy();
  });
});
