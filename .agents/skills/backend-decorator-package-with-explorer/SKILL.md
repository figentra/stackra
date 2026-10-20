---
name: backend-decorator-package-with-explorer
description: Add a decorator to a Stackra package the house way - createDecorator over the container's typed MetadataRegistry, a defineMetadataKey per kind, the package's Explorer that registers decorated providers at bootstrap through DiscoveryService, and the conformance test against stackra gen. Use when a package introduces or changes a decorator (@OnEvent, @Cron, @AsJob, @Setting, @Command and the like).
---

# A decorator package with its Explorer

Each package owns its decorators (ADR 0117 C2). Every package that defines decorators ships an **Explorer**: at
bootstrap it finds the decorated providers and methods through the container's `DiscoveryService` and registers them
(ADR 0144). `stackra gen` reads the same metadata statically, and a conformance test proves the two agree. Decorators are
legacy (`experimentalDecorators`) over the container's WeakMap store; there is no global metadata polyfill (ADR 0005).

Shapes follow the ADRs; `@stackra/container` docs win once it ships.

## Rules

1. Decorators **annotate** classes, methods and fields; they never build a value. Values come from `define*`
   (ADR 0247, skill `backend-define-family`).
2. One metadata key per decorator kind, typed: `defineMetadataKey<T>()`.
3. The Explorer lives in the package's `./node` entry (or core when it is runtime-neutral) and runs at bootstrap.
4. The decorator, its metadata type and the Explorer are exported; the metadata type also goes in `./contracts` when
   gen or another package reads it.
5. A command contributed by a package is namespaced `<area>:<verb>` and shows in `stackra list` (ADR 0144).

## Worked example: `@OnSchedule` in a scheduler package

```ts
// src/core/decorators/on-schedule.decorator.ts
import { createDecorator, defineMetadataKey } from "@stackra/container";

export interface OnScheduleMetadata {
  key: string;          // <module>.<name>, unique across the manifest
  cron: string;
  timezone?: string;
}
export const ON_SCHEDULE = defineMetadataKey<OnScheduleMetadata>("stackra.scheduler.on-schedule");

/** Marks a provider method to run on a schedule. */
export const OnSchedule = createDecorator<OnScheduleMetadata>(ON_SCHEDULE, { target: "method" });
```

```ts
// src/node/scheduler.explorer.ts
import { Injectable, DiscoveryService, type OnApplicationBootstrap } from "@stackra/container";
import { ON_SCHEDULE } from "#core/decorators/on-schedule.decorator";
import { SchedulerRegistry } from "#core/scheduler.registry";

@Injectable()
export class SchedulerExplorer implements OnApplicationBootstrap {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly registry: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    for (const { instance, method, metadata } of this.discovery.methodsWith(ON_SCHEDULE)) {
      this.registry.add(metadata.key, metadata.cron, () => instance[method]());
    }
  }
}
```

```ts
// src/node/__tests__/scheduler.explorer.test.ts — conformance with gen
it("registers what gen discovers", async () => {
  const module = await createTestingModule({ imports: [SchedulerModule, FixtureModule] }).compile();
  const runtime = module.get(SchedulerRegistry).keys();
  const generated = await discoverWithGen(FixtureModule, ON_SCHEDULE); // testing helper of the gen package
  expect(runtime).toEqual(generated.map((m) => m.key));
});
```

The consuming code stays declarative:

```ts
@Injectable()
export class InvoiceReminders {
  @OnSchedule({ key: "billing.invoice-reminders", cron: "0 8 * * *", timezone: "Asia/Dubai" })
  async send(): Promise<void> { /* calls an action, never business logic inline */ }
}
```

## Never

- A `define*` call placed on a class member, or a decorator that constructs a value (ADR 0247 lint).
- A global registry populated at import time; registration happens in the Explorer at bootstrap.
- A separate `*-decorators` package; the package that owns the behaviour owns its decorators (ADR 0117).
- String DI tokens (ADR 0145).

## Check

The conformance test above, `pnpm --filter <package> test typecheck build`, then `pnpm verify`. Gen changes needed for a
new kind go to `compiler-engineer`.
