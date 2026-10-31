/**
 * Stackra file contract:
 * Purpose: unit tests of `yamlKeyTree`: nested block mappings become a key tree, quoted keys and comments are read,
 *          and list items, an empty flow map and the lines of a block scalar add no keys (STA-1727).
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296; STA-1727.
 */
import { describe, expect, it } from "@stackra/testing";

import { yamlKeyTree } from "#node/functions/yaml-key-tree.function";
import type { YamlKeyTree } from "#node/types/yaml-key-tree.type";

/** The tree as nested plain objects, for an exact comparison. */
function plain(tree: YamlKeyTree): unknown {
  return Object.fromEntries([...tree].map(([key, child]) => [key, plain(child)]));
}

describe(yamlKeyTree, () => {
  it("reads nested keys, quoted keys and comments, and skips lists, flow maps and block scalars", () => {
    const source = [
      "version: 3 # runway v3",
      "regions:",
      "  - gcc",
      "requires: {}",
      "environments:",
      "  production:",
      "    queues:",
      "      billing:",
      "        visibilityTimeoutSeconds: 300",
      '      "ledger_close":',
      "        dlq: true",
      "    note: |",
      "      looks: like a key",
      "  staging:",
      "    queues: {}",
    ].join("\n");
    expect(plain(yamlKeyTree(source))).toEqual({
      version: {},
      regions: {},
      requires: {},
      environments: {
        production: {
          queues: { billing: { visibilityTimeoutSeconds: {} }, ledger_close: { dlq: {} } },
          note: {},
        },
        staging: { queues: {} },
      },
    });
  });
});
