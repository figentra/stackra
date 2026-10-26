/**
 * Stackra file contract:
 * Purpose: `ACTIONS_TESTING_PLUGIN`, the testing-module plugin of @stackra/actions: it adds
 *          `.withExtensions([...])` to the builder, connects the extension slots to each compiled app (with that
 *          module's inline extensions only) and gives `run(...)` a pipeline over the app, whose approval step uses
 *          `OpenApprovalGateDriver` when the test binds no `ApprovalGate`.
 * Boundary: registers itself when this module loads; `./testing` is loaded only by vitest (gen's vitest config loads
 *           it for every member that depends on @stackra/actions). Imports `.`, `./contracts` and `@stackra/container/testing` only (ADR
 *           0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the STA-348 registry row (builder extension point).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingModuleBuilder, TestingPlugin } from "@stackra/container/testing";

import { ApprovalGate } from "#contracts/index";
import { ActionPipeline, connectExtensions, OpenApprovalGateDriver } from "#core/index";
import type { InlineExtension, Resolver } from "#core/index";
import { CURRENT_PIPELINE } from "#testing/constants/current-pipeline.constant";

declare module "@stackra/container/testing" {
  interface TestingModuleBuilder {
    /**
     * Adds function implementers to extension slots for this testing module only (build them with `extension(...)`);
     * calls add up.
     */
    withExtensions(extensions: readonly InlineExtension[]): this;
  }
}

/** Each builder's inline extensions, connected when it compiles. */
const INLINE = new WeakMap<TestingModuleBuilder, InlineExtension[]>();

/** The actions testing-module plugin. */
export const ACTIONS_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/actions",
  builder: {
    withExtensions(this: TestingModuleBuilder, extensions: readonly InlineExtension[]) {
      let list = INLINE.get(this);
      if (list === undefined) {
        const created: InlineExtension[] = [];
        INLINE.set(this, created);
        this.onCompile((app) => connectExtensions(app, created));
        list = created;
      }
      list.push(...extensions);
      return this;
    },
  },
  app(app: TestingApp) {
    // Runs before the builder's onCompile steps, so `.withExtensions` reconnects with its implementers afterwards.
    connectExtensions(app);
    // The approval step fails closed in an app; a test that binds no gate means "no approvals", so it gets the open one.
    const open = new OpenApprovalGateDriver();
    const resolver: Resolver = {
      has: (token) => token === ApprovalGate || app.has(token),
      get: (token) =>
        token === ApprovalGate && !app.has(token) ? (open as never) : app.get(token),
    };
    CURRENT_PIPELINE.value = { app, pipeline: new ActionPipeline(resolver) };
    return {};
  },
};

registerTestingPlugin(ACTIONS_TESTING_PLUGIN);
