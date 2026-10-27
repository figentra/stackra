/**
 * Stackra file contract:
 * Purpose: unit tests of `defineContainerDevtools`: it defines the `container.bindings` tab, its read returns
 *          `Container.bindings()` (names only), and the returned remover is the kit's.
 * Boundary: test only; a recording fake stands in for `DevtoolsKit`, which container cannot depend on (the kit depends
 *           on container).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0246 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { Service } from "#core/bases/service.base";
import { Lifetime } from "#core/decorators/lifetime.decorator";
import { Container } from "#core/services/container.service";
import { defineContainerDevtools } from "#devtools/functions/define-container-devtools.function";
import type { DevtoolsTabSink } from "#devtools/types/devtools-tab-sink.type";
import type { DevtoolsTabSinkDefinition } from "#devtools/types/devtools-tab-sink-definition.type";

class GreetingService extends Service {}

/** A kit fake that records every defined tab and every removal. */
function fakeKit(): DevtoolsTabSink & {
  readonly tabs: DevtoolsTabSinkDefinition[];
  readonly removed: string[];
} {
  const tabs: DevtoolsTabSinkDefinition[] = [];
  const removed: string[] = [];
  return {
    tabs,
    removed,
    defineTab: (definition) => {
      tabs.push(definition);
      return () => {
        removed.push(definition.id);
      };
    },
  };
}

describe("defineContainerDevtools", () => {
  it("defines the container.bindings tab, which reads the bindings listing", async () => {
    const container = await Container.create([
      {
        member: "greeting",
        bindings: [
          { module: "greeting", provide: GreetingService, lifetime: Lifetime.Transient, deps: [] },
        ],
      },
    ]);
    const kit = fakeKit();
    defineContainerDevtools(kit, container);
    expect(kit.tabs.map((tab) => [tab.id, tab.category])).toEqual([
      ["container.bindings", "container"],
    ]);
    expect(kit.tabs[0]?.read()).toEqual([
      {
        token: "GreetingService",
        scope: "greeting",
        lifetime: "transient",
        implementation: "GreetingService",
      },
    ]);
  });

  it("returns the kit's remover", async () => {
    const kit = fakeKit();
    const remove = defineContainerDevtools(kit, await Container.create([]));
    remove();
    expect(kit.removed).toEqual(["container.bindings"]);
  });
});
