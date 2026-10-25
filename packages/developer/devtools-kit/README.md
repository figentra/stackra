# @stackra/devtools-kit

The kit every package's devtools entry talks to (ADR 0246): a registry of data tabs and RPC functions, a stream that
packages emit on and that every event the in-process bus delivers joins, and the one host session through which an
app's floating panel or the dev console of `stackra dev` reads all of it. No UI and no transport: the host owns both.

**Tier:** `tier:lib` (`packages/developer/devtools-kit`). Entry `.` only (ADR 0127, 2026-10-24 note). Depends on
`@stackra/events` (the bus), `@stackra/container` (`Service`) and `@stackra/contracts` (`Clock`).

Development only: production builds carry no devtools code (ADR 0246 decision 1). In staging, operators only.

## What is here

| Symbol                                                  | Use                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `DevtoolsKit`                                           | the service: `defineTab`, `defineRpc`, `emit`, `attach`, `tabs`, `rpcNames` |
| `DevtoolsError`, `DevtoolsErrorCode`                    | a failed call, with a snake_case code                                       |
| `DEVTOOLS_BUS_CHANNEL`, `DevtoolsBusOccurrence`         | the `bus` channel and its payload: each event the bus delivered             |
| `DevtoolsTabDefinition`, `DevtoolsTabMetadata`          | a tab as a package defines it, and as a host lists it                       |
| `DevtoolsRpcHandler`, `DevtoolsRemover`                 | an RPC function, and what a definition returns to undo itself               |
| `DevtoolsEvent`                                         | one stream entry: sequence, channel, payload, time                          |
| `DevtoolsHost`, `DevtoolsAttachment`, `DevtoolsSession` | what attaches, what it gets back, and how it reads the kit                  |

## A package: define tabs and RPC functions

A package's devtools entry is a service that takes the kit by its type and defines what it shows:

```ts
import { Service } from "@stackra/container";
import { DevtoolsKit } from "@stackra/devtools-kit";

export class RouterDevtools extends Service {
  constructor(kit: DevtoolsKit, router: Router) {
    super();
    kit.defineTab({
      id: "router.tree",
      title: "Routes",
      category: "router",
      order: 10,
      read: () => router.toJson(),
    });
    kit.defineRpc("router.match", (path) => (typeof path === "string" ? router.match(path) : null));
  }
}
```

- Ids, RPC names and channels are dotted lowercase segments, the package key first (`router.tree`, `cache.hit_rate`);
  anything else throws `DevtoolsError("invalid_name")`.
- A newer definition with the same id or name replaces the older one, so a module reloaded in development simply
  defines again. Each definition returns a remover that undoes only itself.
- `read()` runs when a host opens the tab. Data that changes often is also emitted: `kit.emit("cache.hit", { key })`.
- RPC arguments come from the host: check them before use.
- `sensitive: true` withholds a tab from any host that did not declare `acceptsSensitive: true`.

## The bus timeline

The kit subscribes to every event the in-process `EventBus` delivers and emits each on `DEVTOOLS_BUS_CHANNEL`
(`"bus"`) as `{ type, event, context }`: the class name, the event and its metadata (id, time, tenant, actor,
correlation). A host filters the timeline with `session.replay("bus")`.

## A host: attach

```ts
const { session, detach } = kit.attach({
  name: "vite-devtools",
  acceptsSensitive: true,
  onTabsChanged: (tabs) => render(tabs),
  onRpcChanged: (names) => updateCommands(names),
  onEvent: (event) => timeline.push(event),
});

await session.readTab("router.tree");
await session.call("router.match", "/orders");
session.replay(); // the newest 500 entries, oldest first
detach();
```

One host at a time (`DevtoolsError("host_attached")` otherwise). A host callback that throws is ignored, so a host bug
never breaks the package that emitted. After `detach()` the session throws `DevtoolsError("detached")`.

## Testing

```ts
const bus = new EventBus(clock);
const kit = new DevtoolsKit(bus, clock);
new RouterDevtools(kit, router);

expect(kit.tabs().map((tab) => tab.id)).toContain("router.tree");
await expect(kit.attach({ name: "test" }).session.readTab("router.tree")).resolves.toEqual(
  router.toJson(),
);
```
