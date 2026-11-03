/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeResource`: classes become their versioned keys (a ref's static key, or what `keyOf`
 *          answers), enums their definitions with case data, `undefined` fields are dropped, and what cannot travel
 *          (a class with no key, an icon element, a non-finite number, a `Date`) throws naming its path.
 * Boundary: test only. The round trip is `decode-resource.function.test.ts`'s.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 5 and 7); build-list item 54 (STA-1981).
 */
import { actionRef } from "@stackra/clients";
import { ApiArea, Enum, Tone } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { Count } from "#core/enums/count.enum";
import { encodeResource } from "#core/functions/encode-resource.function";
import type { ResourceTree } from "#core/types/resource-tree.type";

const Flag = Enum.of({ On: ["on", { tone: Tone.Success }], Off: "off" });

const CancelOrder = actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({}),
});

/** An icon element as React builds one; elements do not travel. */
const ICON_ELEMENT = {
  $$typeof: Symbol.for("react.transitional.element"),
  type: "svg",
  props: {},
  key: null,
} as never;

/** An authored action class: no static key, as on the server. */
class ArchiveOrderAction {}

const tree = (extra: Partial<ResourceTree>): ResourceTree => ({
  options: { area: ApiArea.Admin, operations: { list: true } },
  ...extra,
});

describe("encodeResource", () => {
  it("writes a ref as its key, an enum as its definition and drops undefined fields", () => {
    const wire = encodeResource(
      tree({
        table: {
          columns: [{ kind: "value", key: "flag", enum: Flag, label: undefined }],
          filters: [],
          count: Count.Estimated,
        },
        actions: [{ kind: "run", action: CancelOrder }],
      }),
    );
    expect(wire).toEqual({
      options: { area: "admin", operations: { list: true } },
      table: {
        columns: [
          { kind: "value", key: "flag", enum: { On: ["on", { tone: "success" }], Off: "off" } },
        ],
        filters: [],
        count: "estimated",
      },
      actions: [{ kind: "run", action: "orders.order.cancel@1" }],
    });
    expect(Object.hasOwn(wire.table?.columns[0] ?? {}, "label")).toBe(false);
  });

  it("asks keyOf for a class with no static key", () => {
    const wire = encodeResource(
      tree({ actions: [{ kind: "run", action: ArchiveOrderAction }] }),
      (type) => (type === ArchiveOrderAction ? "orders.order.archive@1" : undefined),
    );
    expect(wire.actions).toEqual([{ kind: "run", action: "orders.order.archive@1" }]);
  });

  it("throws, naming the path, for what cannot travel", () => {
    expect(() =>
      encodeResource(tree({ actions: [{ kind: "run", action: ArchiveOrderAction }] })),
    ).toThrow(/tree\.actions\[0\]\.action is the class ArchiveOrderAction/);
    expect(() =>
      encodeResource(tree({ actions: [{ kind: "create", startIcon: ICON_ELEMENT }] })),
    ).toThrow(/tree\.actions\[0\]\.startIcon is an icon element/);
    expect(() =>
      encodeResource(
        tree({ views: [{ name: "all", filter: { total: Number.POSITIVE_INFINITY } }] }),
      ),
    ).toThrow(/tree\.views\[0\]\.filter\.total is Infinity/);
    expect(() =>
      encodeResource(tree({ views: [{ name: "all", filter: { since: new Date(0) } }] })),
    ).toThrow(/tree\.views\[0\]\.filter\.since is not JSON data/);
  });
});
