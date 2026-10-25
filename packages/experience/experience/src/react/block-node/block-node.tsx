/**
 * Stackra file contract:
 * Purpose: `BlockNode`, the web drawing of one checked document node: the registered component with the node's props,
 *          `onEvent` wired to the host's handlers, the drawn children, and, for a block that accepts a query, `data`
 *          once the query answers.
 * Boundary: internal to the `./react` entry (the driver draws it); not exported. The node already passed
 *           `resolveDocument`. A block's query runs through `@stackra/clients`' `useQuery` (cached and deduplicated by
 *           query and input); while it loads a `@stackra/ui` Skeleton holds the place, and a failed query draws nothing
 *           for that block, so one feed's outage never takes the page down.
 * Runtime: browser
 * Governing contract: ADR 0110 (decisions 2 and 3); ADR 0112 (X6, X9: renderers on @stackra/ui free components).
 */
import type { QueryRef, RefInput } from "@stackra/clients";
import { useQuery } from "@stackra/clients/react";
import type { Json } from "@stackra/contracts";
import { Skeleton } from "@stackra/ui/react";
import type { ComponentType, ReactNode } from "react";

import type { BlockEvent } from "#contracts/types/block-event.type";
import type { RenderContext } from "#contracts/types/render-context.type";
import { dispatchBlockEvent } from "#core/functions/dispatch-block-event.function";
import type { ResolvedNode } from "#core/types/resolved-node.type";

/** Props of a drawn node. */
interface BlockNodeProps {
  /** The checked node. */
  readonly node: ResolvedNode;
  /** The render's locale and the host's handlers. */
  readonly context: RenderContext;
}

/** Props of the query wrapper. */
interface AcceptedDataProps {
  /** The query the block accepts. */
  readonly query: QueryRef;
  /** The node's input for it. */
  readonly input: Json;
  /** Draws the block with the answer. */
  readonly children: (data: unknown) => ReactNode;
}

/** Runs the accepted query and draws the block with its answer. */
function AcceptedData({ query, input, children }: AcceptedDataProps): ReactNode {
  // shortcut: one request per block; a batched `experience.query.batch` call waits for the experience service.
  const answer = useQuery(query, input as RefInput<QueryRef>);
  if (answer.data !== undefined) return children(answer.data);
  return answer.error === null ? <Skeleton className="h-24 w-full rounded-lg" /> : null;
}

/**
 * Draws `node` and its children.
 *
 * @example
 * <BlockNode key={node.path} node={node} context={context} />
 */
export function BlockNode({ node, context }: BlockNodeProps): ReactNode {
  const Component = node.entry.component as ComponentType<Record<string, unknown>>;
  const props = {
    ...node.props,
    onEvent: (event: BlockEvent) => dispatchBlockEvent(event, context),
    ...(node.children.length === 0
      ? {}
      : {
          children: node.children.map((child) => (
            <BlockNode key={child.path} node={child} context={context} />
          )),
        }),
  };
  if (node.accepts === null) return <Component {...props} />;
  return (
    <AcceptedData query={node.accepts} input={node.input}>
      {(data) => <Component {...props} data={data} />}
    </AcceptedData>
  );
}
