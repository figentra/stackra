/**
 * Stackra file contract:
 * Purpose: unit tests of `listUpstreamTools`: every page is read by its `nextCursor`, an empty cursor ends the list,
 *          and a cursor that repeats stops the loop.
 * Boundary: test only; a fake peer.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); R-29; STA-2873.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { listUpstreamTools } from "#node/functions/list-upstream-tools.function";
import type { McpPeer } from "#node/types/mcp-peer.type";

/** A peer whose `tools/list` answers with `page(cursor)`. */
function peer(
  page: (cursor: string | undefined) => unknown,
): McpPeer & { request: ReturnType<typeof vi.fn> } {
  return {
    request: vi.fn(async (_method: string, params?: unknown) =>
      page((params as { cursor?: string } | undefined)?.cursor),
    ),
    notify: () => undefined,
    close: () => undefined,
    closed: Promise.resolve(),
  };
}

describe("listUpstreamTools", () => {
  it("follows nextCursor until a page has none", async () => {
    const upstream = peer((cursor) =>
      cursor === undefined
        ? { tools: [{ name: "a" }], nextCursor: "p2" }
        : cursor === "p2"
          ? { tools: [{ name: "b" }], nextCursor: "" }
          : { tools: [{ name: "never" }] },
    );
    await expect(listUpstreamTools(upstream)).resolves.toEqual([{ name: "a" }, { name: "b" }]);
    expect(upstream.request.mock.calls).toEqual([
      ["tools/list", {}],
      ["tools/list", { cursor: "p2" }],
    ]);
  });

  it("stops at a cursor it has seen", async () => {
    const upstream = peer(() => ({ tools: [{ name: "a" }], nextCursor: "again" }));
    await expect(listUpstreamTools(upstream)).resolves.toEqual([{ name: "a" }, { name: "a" }]);
    expect(upstream.request).toHaveBeenCalledTimes(2);
  });

  it("reads a page with no tools as none", async () => {
    await expect(listUpstreamTools(peer(() => ({})))).resolves.toEqual([]);
  });
});
