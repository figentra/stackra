/**
 * Stackra file contract:
 * Purpose: `SCOPE_TESTING_PLUGIN`, the testing-module plugin of @stackra/scope: on every compiled testing app whose
 *          `ScopeTree` is an unseeded `MemoryScopeTreeDriver` (the `memory` candidate), it points that tree at the
 *          Database's `ScopeNode` rows through `PostgresScopeTreeDriver` over the app's `ScopeNodeService`, so a node
 *          added through `ScopeNodeService` is the node `ScopeTree` reads, by id, by path and along the path, as in
 *          production. Registered when this module loads.
 * Boundary: holds no state. A tree a test seeds (`fakeScopeTree`, `.override(ScopeTree, ...)`) keeps its own list. An
 *           app that binds no `ScopeNodeService` keeps the empty memory tree. The node entry is imported on the first
 *           read, so an app that never reads the tree never loads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 1 and 3); ADR 0269 (decision 3); ADR 0263 (decision 12: the testing module).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingPlugin } from "@stackra/container/testing";

import { ScopeTree } from "#contracts/index";
import { MemoryScopeTreeDriver } from "#core/index";

/** The node table's tree for `app`, or undefined when the app binds no `ScopeNodeService`. */
async function nodeTreeOf(app: TestingApp): Promise<ScopeTree | undefined> {
  const { PostgresScopeTreeDriver, ScopeNodeService } = await import("#node/index");
  return app.has(ScopeNodeService)
    ? new PostgresScopeTreeDriver(app.get(ScopeNodeService))
    : undefined;
}

/** The scope testing-module plugin. */
export const SCOPE_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/scope",
  app(app: TestingApp) {
    const tree = app.has(ScopeTree) ? app.get(ScopeTree) : undefined;
    if (tree instanceof MemoryScopeTreeDriver) tree.readFrom(() => nodeTreeOf(app));
    return {};
  },
};

registerTestingPlugin(SCOPE_TESTING_PLUGIN);
