/**
 * Stackra file contract:
 * Purpose: `ACTIONS_TESTING_PLUGIN`, the testing-module plugin of @stackra/actions: it adds
 *          `.withExtensions([...])` to the builder, connects the extension slots to each compiled app (with that
 *          module's inline extensions only) and gives `run(...)` a pipeline over the app whose audit trail records each
 *          call's entry for `RunResult.audit` (forwarding to the app's own trail); it offers the "memory"
 *          `AccessControl` (`MemoryAccessControlDriver`) a test picks with `.useDrivers("memory")`.
 * Boundary: registers itself when this module loads; `./testing` is loaded only by vitest (gen's vitest config loads
 *           it for every member that depends on @stackra/actions). Imports `.`, `./contracts` and `@stackra/container/testing` only (ADR
 *           0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the STA-348 registry row (builder extension point).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingModuleBuilder, TestingPlugin } from "@stackra/container/testing";

import { AccessControl, AuditTrail } from "#contracts/index";
import { ActionPipeline, connectExtensions } from "#core/index";
import type { InlineExtension, Resolver } from "#core/index";
import { CURRENT_PIPELINE } from "#testing/constants/current-pipeline.constant";
import { MemoryAccessControlDriver } from "#testing/drivers/memory-access-control.driver";
import { RecordingAuditTrailDriver } from "#testing/drivers/recording-audit-trail.driver";

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
  drivers: [
    {
      port: AccessControl,
      key: "actions.AccessControl",
      candidates: { memory: () => Promise.resolve(MemoryAccessControlDriver) },
    },
  ],
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
    const trail = new RecordingAuditTrailDriver(app);
    const resolver: Resolver = {
      has: (token) => token === AuditTrail || app.has(token),
      get: (token) => (token === AuditTrail ? (trail as never) : app.get(token)),
    };
    CURRENT_PIPELINE.value = { app, pipeline: new ActionPipeline(resolver), trail };
    return {};
  },
};

registerTestingPlugin(ACTIONS_TESTING_PLUGIN);
