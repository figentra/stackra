/**
 * Stackra file contract:
 * Purpose: `emitBoot`, a service's `#stackra/boot` (`.stackra/gen/boot.ts`): one `boot(container, { signal })`
 *          that connects what needs the booted container, in order: the bound `HoldRegistry` and `SequenceTimeZone`
 *          drivers (or none), `PostgresDatabaseDriver.connect` with the url of the service's Encore `database`
 *          (`emitEncoreDatabase`), the read replicas of `DATABASE_REPLICA_URLS` (comma-separated, none when unset),
 *          the bound `DatabaseConfig`'s session `timeouts` and the subscribers: the legal-hold one, the
 *          `StampSubscriber`, the `EncryptedFieldsSubscriber` over the bound `FieldCipher` (when a model, own or a declared package's, has
 *          `HasEncryptedFields`; stackra-262) and the outbox writer among its subscribers,
 *          `segments.connect(container)`, `EventBus#connect` and `InboxService#connect` (the
 *          registered listeners and relays, disconnected when the signal aborts), the live queries' refresh (one
 *          `liveQueryRoutes` call per query with `cache.invalidateOn`, each route subscribed on the bus and sent through
 *          `RealtimeRelay` or `RealtimeBroadcaster`, when the service runs `@stackra/realtime`; STA-1445), then `relay.connect(container)` and
 *          the relay's `work` loop until the signal aborts. A signal already aborted when `boot` starts connects
 *          nothing; one that aborts while the database connects disconnects the bus and inbox at once.
 * Boundary: pure. Each step is written only when the service runs its package (`@stackra/database` or a model,
 *           `@stackra/outbox`, `@stackra/segments`, `@stackra/events`); nothing to connect means no file. The connection
 *           strings are the runtime's (Encore's database and the replica variable runway sets for `readReplica`),
 *           never logged; `@stackra/app/server` calls `boot` once it hands the entry its container.
 * Runtime: isomorphic
 * Governing contract: ADR 0014 (decision 5: the runtime provides the connection); ADR 0078 (the outbox relay); ADR
 *                     0332 (segments); ADR 0295 (decision 8: boot order belongs to the runtime); ADR 0134 (2026-10-24
 *                     amendment: every disposal path asks the connected `HoldRegistry`); ADR 0394 (decision 1); ADR 0263 (the
 *                     container is ready before anything resolves from it); ADR 0260 (decision 4: typed subscribers
 *                     and relays receive only once connected); ADR 0465 (decision 5: the model encryption path); ADR 0238 (the
 *                     service's own database, stackra-250); ADR 0057 (decision 6: read replicas); ADR 0315 (decision 1: a
 *                     query with `cache.invalidateOn` is live, its refresh sent after commit).
 */
import type { StackraManifest } from "@stackra/contracts";

import { generatedHeader } from "#core/functions/generated-header.function";
import { usesDatabase } from "#core/functions/uses-database.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** A manifest entry, read loosely. */
type Entry = Readonly<Record<string, unknown>>;

/** The refresh listener and helpers a boot with live queries carries (ADR 0315 decision 1). */
const LIVE_QUERY_LISTENER = [
  "",
  "/** Sends one live query refresh route of a committed event: data-free, under the query's permission. */",
  "class LiveQueryRefreshListener extends Listener {",
  "  private readonly send: (record: RecordedEvent, route: BroadcastRoute) => Promise<unknown>;",
  "",
  "  private readonly route: BroadcastRoute;",
  "",
  "  constructor(send: (record: RecordedEvent, route: BroadcastRoute) => Promise<unknown>, route: BroadcastRoute) {",
  "    super();",
  "    this.send = send;",
  "    this.route = route;",
  "  }",
  "",
  "  async handle(event: Event, ctx: ListenerContext): Promise<void> {",
  "    const meta = {",
  "      id: ctx.eventId,",
  "      occurredAt: ctx.occurredAt,",
  "      ...(ctx.scopeId === undefined ? {} : { scopeId: ctx.scopeId }),",
  "      ...(ctx.actor === undefined ? {} : { actor: ctx.actor }),",
  "    };",
  "    await this.send({ event, meta }, this.route);",
  "  }",
  "}",
];

/**
 * The live queries of `manifest` (its own and its hosted packages'): each query with `cache.invalidateOn`, printed as
 * a row of its permission, its refresh audience (the caller's own for `per: principal`, the scope's otherwise) and the
 * invalidating events' wire names.
 */
function liveQueryRows(manifest: StackraManifest | undefined): string[] {
  return ((manifest?.actions ?? []) as readonly Entry[]).flatMap((entry) => {
    const cache = entry["cache"] as
      | { readonly per?: unknown; readonly invalidateOn?: unknown }
      | undefined;
    const names = Array.isArray(cache?.invalidateOn)
      ? cache.invalidateOn.filter((name): name is string => typeof name === "string")
      : [];
    const permission = entry["permission"];
    if (entry["kind"] !== "query" || names.length === 0 || typeof permission !== "string")
      return [];
    const audience =
      cache?.per === undefined || cache.per === "principal"
        ? "BroadcastAudience.Principal"
        : "BroadcastAudience.Scope";
    return [
      `  { permission: ${JSON.stringify(permission)}, audience: ${audience}, invalidateOn: ${JSON.stringify(names)} },`,
    ];
  });
}

/**
 * The boot file of a service, or undefined when it has nothing to connect.
 *
 * @param ir - the member read by discovery.
 * @param built - the manifest built from `ir`, whose live queries (own and hosted) get their refresh wired.
 * @example
 * emitBoot(serviceIr); // "...export async function boot(container: Container, options: ...): Promise<void> {..."
 */
export function emitBoot(ir: MemberIR, built?: StackraManifest): string | undefined {
  if (ir.layout !== "service") return undefined;
  const uses = (name: string): boolean =>
    (ir.packages ?? []).includes(name) ||
    ir.dependencies.some((dependency) => dependency.package === name);
  const database = usesDatabase(ir);
  // A model with `HasEncryptedFields` (own or a declared package's) is sealed by the subscriber, never written in clear.
  const encrypted =
    ir.classes.some(
      (declared) =>
        declared.kind === "model" &&
        declared.traits.some((trait) => trait.name === "HasEncryptedFields"),
    ) ||
    ir.dependencies.some(({ manifest }) =>
      (manifest.models ?? []).some((model) => model.traits.includes("HasEncryptedFields")),
    );
  const outbox = uses("@stackra/outbox");
  const segments = uses("@stackra/segments");
  // The outbox depends on the bus, so a service with an outbox has one to connect.
  const events = outbox || uses("@stackra/events");
  if (!database && !outbox && !segments && !events) return undefined;
  // Live queries refresh their clients through realtime after each invalidating event commits (ADR 0315 decision 1).
  const live = events && uses("@stackra/realtime") ? liveQueryRows(built) : [];

  const imports = ['import type { Container } from "@stackra/container";'];
  const steps: string[] = [];
  if (database) {
    imports.push(
      'import { HoldRegistry, SequenceTimeZone } from "@stackra/database/contracts";',
      'import { connectHoldRegistry, connectSequenceTimeZone, DatabaseConfig, HoldSubscriber, StampSubscriber } from "@stackra/database";',
      'import { PostgresDatabaseDriver } from "@stackra/database/node";',
      `import { database } from "../encore/${ir.member}/database";`,
    );
    if (encrypted)
      imports.push(
        'import { FieldCipher } from "@stackra/contracts";',
        'import { EncryptedFieldsSubscriber } from "@stackra/model";',
      );
    steps.push(
      "  connectHoldRegistry(container.has(HoldRegistry) ? container.get(HoldRegistry) : undefined);",
      "  connectSequenceTimeZone(",
      "    container.has(SequenceTimeZone) ? container.get(SequenceTimeZone) : undefined,",
      "  );",
      "  const config = container.has(DatabaseConfig) ? container.get(DatabaseConfig) : undefined;",
      '  const replicas = (process.env["DATABASE_REPLICA_URLS"] ?? "").split(",").filter((url) => url !== "");',
      "  await PostgresDatabaseDriver.connect({",
      "    url: database.connectionString,",
      "    replicas,",
      "    ...(config === undefined ? {} : { timeouts: config.timeouts }),",
      `    subscribers: [new HoldSubscriber(), new StampSubscriber()${encrypted ? ", new EncryptedFieldsSubscriber(container.get(FieldCipher))" : ""}${outbox ? ", container.get(OutboxWriterService)" : ""}],`,
      "  });",
    );
  }
  if (outbox)
    imports.push(
      'import { InboxService, OutboxRelayService, OutboxWriterService } from "@stackra/outbox/node";',
    );
  if (segments) {
    imports.push('import { SegmentService } from "@stackra/segments/node";');
    steps.push("  container.get(SegmentService).connect(container);");
  }
  if (events) {
    imports.push(
      live.length > 0
        ? 'import { BroadcastAudience, type Event, EVENT_NAMES, EventBus, Listener, type ListenerContext } from "@stackra/events";'
        : 'import { EventBus } from "@stackra/events";',
    );
    steps.push("  const bus = container.get(EventBus);", "  bus.connect(container);");
  }
  if (live.length > 0) {
    imports.push(
      'import type { RecordedEvent } from "@stackra/events/contracts";',
      'import { type BroadcastRoute, liveQueryRoutes, RealtimeBroadcaster, RealtimeRelay } from "@stackra/realtime";',
    );
    steps.push(
      "  // With more than one instance the relay fans the refresh out; with the local fanout both deliver the same.",
      "  const realtime = container.has(RealtimeRelay) ? container.get(RealtimeRelay) : container.get(RealtimeBroadcaster);",
      "  const send = (record: RecordedEvent, route: BroadcastRoute): Promise<unknown> => realtime.broadcast(record, route);",
      "  for (const refresh of LIVE_QUERIES)",
      "    for (const route of liveQueryRoutes({",
      "      ...refresh,",
      "      invalidateOn: refresh.invalidateOn.map((eventName) => ({ eventName, prototype: {} })),",
      "    })) {",
      "      const type = EVENT_NAMES.byName.get(route.name);",
      "      if (type === undefined)",
      "        throw new Error(`the live query event ${route.name} is not registered: run stackra gen`);",
      "      bus.subscribe(type, new LiveQueryRefreshListener(send, route));",
      "    }",
    );
  }
  if (outbox)
    steps.push("  const inbox = container.get(InboxService);", "  inbox.connect(container);");
  if (events)
    steps.push(
      "  const disconnect = (): void => {",
      "    bus.disconnect();",
      ...(outbox ? ["    inbox.disconnect();"] : []),
      "  };",
      // An abort listener added after the abort never fires.
      "  if (options.signal.aborted) disconnect();",
      '  else options.signal.addEventListener("abort", disconnect, { once: true });',
    );
  if (outbox)
    steps.push(
      "  const relay = container.get(OutboxRelayService);",
      "  relay.connect(container);",
      "  void relay.work({ signal: options.signal });",
    );

  const header = generatedHeader({
    from: "package.json and the models under src/",
    purpose: `the boot of ${ir.package}: connects what needs the booted container, in order.`,
    boundary:
      "the database url is Encore's, the replicas and the shutdown signal the runtime's; the relay's loop runs until the signal " +
      "aborts, and `boot` resolves once everything is connected.",
    runtime: "node",
  });
  return [
    header,
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    ...imports.sort(),
    ...(live.length > 0
      ? [
          "",
          "/** The live queries: each one's permission, refresh audience and invalidating events (wire names). */",
          "const LIVE_QUERIES: readonly {",
          "  readonly permission: string;",
          "  readonly audience: BroadcastAudience;",
          "  readonly invalidateOn: readonly string[];",
          "}[] = [",
          ...live,
          "];",
          ...LIVE_QUERY_LISTENER,
        ]
      : []),
    "",
    "/** Connects the legal holds and the database, then the services that resolve classes from the container (the bus and inbox until shutdown), then the relay. */",
    "export async function boot(",
    "  container: Container,",
    "  options: { readonly signal: AbortSignal },",
    "): Promise<void> {",
    "  if (options.signal.aborted) return;",
    ...steps,
    "}",
    "",
  ].join("\n");
}
