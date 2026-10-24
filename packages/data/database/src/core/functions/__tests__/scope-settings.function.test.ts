/**
 * Stackra file contract:
 * Purpose: unit tests of the internal `scopeSettings` and `modelKey`: one scope sets its id, path and path list,
 *          several set only the `|`-joined list, none sets every setting to `''`, a path that is not `ltree` is refused,
 *          and a model class name's key and input id key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0327 (decisions 3 and 5); `.agents/rules/tenancy.md`; ADR 0294 (decision 20); ADR 0022;
 *                     ADR 0269.
 */
import type { ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { modelKey } from "#core/functions/model-key.function";
import { scopeSettings } from "#core/functions/scope-settings.function";

const acme: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme" };
const globex: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4", path: "platform.globex" };

describe(scopeSettings, () => {
  it("sets the id, the path and the path list of one scope, given alone or as a list of one", () => {
    const one = [
      ["app.scope_id", acme.id],
      ["app.scope_path", "platform.acme"],
      ["app.scope_paths", "platform.acme"],
    ];
    expect(scopeSettings(acme)).toEqual(one);
    expect(scopeSettings([acme])).toEqual(one);
  });

  it("sets only the joined path list for several scopes, and nothing for none", () => {
    expect(scopeSettings([acme, globex])).toEqual([
      ["app.scope_id", ""],
      ["app.scope_path", ""],
      ["app.scope_paths", "platform.acme|platform.globex"],
    ]);
    expect(scopeSettings([])).toEqual([
      ["app.scope_id", ""],
      ["app.scope_path", ""],
      ["app.scope_paths", ""],
    ]);
  });

  it.each(["", "platform.acme|platform.globex", "platform..acme", "platform acme"])(
    "refuses the path %j",
    (path) => {
      expect(() => scopeSettings({ id: acme.id, path })).toThrow(TypeError);
    },
  );

  it("derives a model key and its id key", () => {
    expect(modelKey("ProductCollection")).toEqual({
      key: "product_collection",
      idKey: "productCollectionId",
    });
  });
});
