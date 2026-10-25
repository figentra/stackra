// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the web `BlockNode`: the component gets the node's props, an `onEvent` that reaches the
 *          host's handlers and its drawn children; a block that accepts a query shows a Skeleton while it loads, gets
 *          the answer as `data`, and draws nothing when the query fails.
 * Boundary: test only, jsdom. `useQuery` and `@stackra/ui/react` are replaced by stand-ins; the nodes are built by
 *           hand, as `resolveDocument` returns them.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decisions 2 and 3); ADR 0112 (X9).
 */
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
import { BlockNode } from "#react/block-node/block-node";

/** The answer the stand-in `useQuery` returns. */
const answer = vi.hoisted(() => ({
  current: { data: undefined as unknown, error: null as unknown },
}));

vi.mock("@stackra/clients/react", () => ({ useQuery: vi.fn(() => answer.current) }));

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  return { Skeleton: () => createElement("div", { "data-testid": "skeleton" }) };
});

class ListEntriesQuery extends queryRef("content.entry.list@1", {
  input: z.object({ type: z.string() }),
  output: z.object({ entries: z.array(z.object({ id: z.string() })) }),
}) {}

class BannerBlock extends Block({ category: BlockCategory.Marketing, icon: "megaphone" }) {}

class FeedBlock extends Block({
  category: BlockCategory.Content,
  icon: "quote",
  accepts: ListEntriesQuery,
}) {}

/** A banner that raises a navigate verb and draws its children. */
function Banner(props: {
  readonly title: string;
  readonly onEvent: (event: BlockEvent) => void;
  readonly children?: ReactNode;
}) {
  return (
    <section>
      <button type="button" onClick={() => props.onEvent({ verb: "navigate", route: "pricing" })}>
        {props.title}
      </button>
      {props.children}
    </section>
  );
}

/** A feed that lists the accepted query's entries. */
function Feed(props: { readonly data: { readonly entries: readonly { readonly id: string }[] } }) {
  return <p>{props.data.entries.map((entry) => entry.id).join(",")}</p>;
}

/** A checked node of `block`. */
const nodeOf = (
  block: typeof BannerBlock | typeof FeedBlock,
  component: unknown,
  props: Readonly<Record<string, unknown>>,
  children: readonly ResolvedNode[] = [],
): ResolvedNode => ({
  path: "0",
  entry: { key: "web.block", block, component },
  props,
  accepts: block === FeedBlock ? ListEntriesQuery : null,
  input: { type: "testimonial" },
  children,
});

afterEach(() => {
  cleanup();
  answer.current = { data: undefined, error: null };
});

describe("BlockNode", () => {
  it("draws the component with its props, its children and an onEvent that reaches the host", () => {
    const onNavigate = vi.fn();
    const child = { ...nodeOf(BannerBlock, Banner, { title: "Inner" }), path: "0.children.0" };
    render(
      <BlockNode
        node={nodeOf(BannerBlock, Banner, { title: "Outer" }, [child])}
        context={{ locale: "en", onNavigate }}
      />,
    );
    expect(screen.getByRole("button", { name: "Inner" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Outer/ }));
    expect(onNavigate).toHaveBeenCalledWith("pricing");
  });

  it("shows a Skeleton while the accepted query loads, then draws its answer as data", () => {
    const node = nodeOf(FeedBlock, Feed, {});
    const { rerender } = render(<BlockNode node={node} context={{ locale: "en" }} />);
    expect(screen.getByTestId("skeleton")).toBeTruthy();
    answer.current = { data: { entries: [{ id: "a" }, { id: "b" }] }, error: null };
    rerender(<BlockNode node={node} context={{ locale: "en" }} />);
    expect(screen.getByText("a,b")).toBeTruthy();
  });

  it("draws nothing for a block whose query failed", () => {
    answer.current = { data: undefined, error: new Error("unavailable") };
    const { container } = render(
      <BlockNode node={nodeOf(FeedBlock, Feed, {})} context={{ locale: "en" }} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
