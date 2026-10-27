/**
 * Stackra file contract:
 * Purpose: unit tests of `registerResources` and `resourceTreeOf`: a registered tree is found by its key, an
 *          unregistered key gets an empty tree, and the disposer takes back only its own entries.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 5).
 */
import { ApiArea } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Count } from "#core/enums/count.enum";
import { registerResources } from "#core/functions/register-resources.function";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import type { ResourceTree } from "#core/types/resource-tree.type";

const tree: ResourceTree = {
  options: { area: ApiArea.Admin, operations: { list: true } },
  table: { columns: [{ kind: "value", key: "status" }], filters: [], count: Count.Estimated },
};

describe("registerResources", () => {
  it("registers trees by key and takes them back", () => {
    const dispose = registerResources({ "orders.order": tree });
    expect(resourceTreeOf("orders.order")).toBe(tree);
    dispose();
    expect(resourceTreeOf("orders.order")).toEqual({});
  });

  it("leaves a newer registration of the same key in place", () => {
    const first = registerResources({ "orders.order": tree });
    const newer = { ...tree };
    const second = registerResources({ "orders.order": newer });
    first();
    expect(resourceTreeOf("orders.order")).toBe(newer);
    second();
  });

  it("gives an unregistered resource an empty tree", () => {
    expect(resourceTreeOf("billing.invoice")).toEqual({});
  });
});
