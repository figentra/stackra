/**
 * Stackra file contract:
 * Purpose: `DevtoolsKit`, the one registry a package's devtools entry fills (data tabs and RPC functions), the stream
 *          it emits on (fed also by every event the in-process bus delivers) and the single host session a devtools
 *          panel or dev console attaches through.
 * Boundary: no UI and no transport: the host owns both. Without a host it only fills its registries and its replay
 *           buffer. A host callback that throws is ignored, so a host bug never breaks the emitting package. A newer
 *           definition of a tab id or RPC name replaces the older one (a module reloaded in development defines
 *           again). Sensitive tabs are withheld from a host that did not accept them. Development only: production
 *           builds carry no devtools code (ADR 0246 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 1 to 4); ADR 0078 (the bus isolates a listener's failure).
 */
import { Service } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { Event, Listener } from "@stackra/events";
import type { EventBus, ListenerContext } from "@stackra/events";

import { DEVTOOLS_BUFFER_SIZE } from "#core/constants/devtools-buffer-size.constant";
import { DEVTOOLS_BUS_CHANNEL } from "#core/constants/devtools-bus-channel.constant";
import { DEVTOOLS_NAME_PATTERN } from "#core/constants/devtools-name-pattern.constant";
import { DevtoolsError } from "#core/errors/devtools.error";
import type { DevtoolsAttachment } from "#core/types/devtools-attachment.type";
import type { DevtoolsBusOccurrence } from "#core/types/devtools-bus-occurrence.type";
import type { DevtoolsEvent } from "#core/types/devtools-event.type";
import type { DevtoolsHost } from "#core/types/devtools-host.type";
import type { DevtoolsRemover } from "#core/types/devtools-remover.type";
import type { DevtoolsRpcHandler } from "#core/types/devtools-rpc-handler.type";
import type { DevtoolsSession } from "#core/types/devtools-session.type";
import type { DevtoolsTabDefinition } from "#core/types/devtools-tab-definition.type";
import type { DevtoolsTabMetadata } from "#core/types/devtools-tab-metadata.type";

/** Throws `invalid_name` unless `name` is dotted lowercase segments. */
function checkName(name: string, what: string): void {
  if (typeof name !== "string" || !DEVTOOLS_NAME_PATTERN.test(name))
    throw new DevtoolsError(
      "invalid_name",
      `devtools ${what} ${JSON.stringify(name)} must be dotted lowercase segments, like "router.tree"`,
    );
}

/** A tab's metadata without its read function. */
function metadataOf({ read: _read, ...metadata }: DevtoolsTabDefinition): DevtoolsTabMetadata {
  return Object.freeze(metadata);
}

/** Runs a host callback, ignoring what it throws. */
function isolated(callback: () => void): void {
  try {
    callback();
  } catch {
    // A host bug must not reach the package that defined, removed or emitted.
  }
}

/**
 * The devtools kit.
 *
 * @example
 * // a package's devtools entry
 * export class RouterDevtools extends Service {
 *   constructor(kit: DevtoolsKit, router: Router) {
 *     super();
 *     kit.defineTab({ id: "router.tree", title: "Routes", category: "router", read: () => router.toJson() });
 *     kit.defineRpc("router.match", (path) => (typeof path === "string" ? router.match(path) : null));
 *   }
 * }
 *
 * // a host
 * const { session, detach } = kit.attach({ name: "vite-devtools", onEvent: (event) => timeline.push(event) });
 * await session.readTab("router.tree");
 */
export class DevtoolsKit extends Service {
  /** Stamps each stream entry. */
  private readonly clock: Clock;

  /** Tabs by id, in definition order. */
  private readonly tabById = new Map<string, DevtoolsTabDefinition>();

  /** RPC functions by name. */
  private readonly rpcByName = new Map<string, DevtoolsRpcHandler>();

  /** The newest stream entries, oldest first. */
  private readonly buffer: DevtoolsEvent[] = [];

  /** The last sequence number handed out. */
  private sequence = 0;

  /** The attached host, if any. */
  private host: DevtoolsHost | undefined;

  /**
   * Subscribes to every event `bus` delivers, reporting each on `DEVTOOLS_BUS_CHANNEL`.
   *
   * @param bus - the in-process event bus.
   * @param clock - the Clock port.
   */
  constructor(bus: EventBus, clock: Clock) {
    super();
    this.clock = clock;
    const emit = (payload: DevtoolsBusOccurrence) => this.emit(DEVTOOLS_BUS_CHANNEL, payload);
    // A class expression, not a declaration: gen registers declared listeners, and this one is the kit's own tap.
    const Tap = class extends Listener {
      async handle(event: Event, ctx: ListenerContext): Promise<void> {
        const { now: _now, ...context } = ctx;
        emit({ type: event.constructor.name, event, context });
      }
    };
    bus.subscribe(Event, new Tap());
  }

  /**
   * Defines a data tab, replacing a tab with the same id.
   *
   * @param definition - the tab's metadata and its read function.
   * @returns removes this definition.
   * @throws DevtoolsError `invalid_name` when the id is not dotted lowercase segments.
   */
  defineTab(definition: DevtoolsTabDefinition): DevtoolsRemover {
    checkName(definition.id, "tab id");
    const entry = Object.freeze({ ...definition });
    this.tabById.set(entry.id, entry);
    this.tabsChanged();
    return () => {
      if (this.tabById.get(entry.id) !== entry) return;
      this.tabById.delete(entry.id);
      this.tabsChanged();
    };
  }

  /**
   * Defines an RPC function, replacing one with the same name.
   *
   * @param name - dotted lowercase segments, the package key first: `container.explain`.
   * @param handler - called with the host's arguments; it checks them before use.
   * @returns removes this definition.
   * @throws DevtoolsError `invalid_name` when the name is not dotted lowercase segments.
   */
  defineRpc(name: string, handler: DevtoolsRpcHandler): DevtoolsRemover {
    checkName(name, "RPC name");
    this.rpcByName.set(name, handler);
    this.rpcChanged();
    return () => {
      if (this.rpcByName.get(name) !== handler) return;
      this.rpcByName.delete(name);
      this.rpcChanged();
    };
  }

  /**
   * Adds one entry to the stream: kept for replay and pushed to the attached host.
   *
   * @param channel - dotted lowercase segments, the package key first: `cache.hit`.
   * @param payload - what happened.
   * @returns the frozen entry.
   * @throws DevtoolsError `invalid_name` when the channel is not dotted lowercase segments.
   */
  emit(channel: string, payload: unknown): DevtoolsEvent {
    checkName(channel, "channel");
    this.sequence += 1;
    const event: DevtoolsEvent = Object.freeze({
      sequence: this.sequence,
      channel,
      payload,
      at: this.clock.now(),
    });
    this.buffer.push(event);
    if (this.buffer.length > DEVTOOLS_BUFFER_SIZE) this.buffer.shift();
    const host = this.host;
    if (host?.onEvent) isolated(() => host.onEvent?.(event));
    return event;
  }

  /** Every tab's metadata, sensitive ones included, sorted by `order` then id; for a package's own tests. */
  tabs(): readonly DevtoolsTabMetadata[] {
    return this.sortedTabs(true);
  }

  /** Every RPC name, sorted; for a package's own tests. */
  rpcNames(): readonly string[] {
    return [...this.rpcByName.keys()].sort();
  }

  /**
   * Attaches the one host.
   *
   * @param host - the panel or console, with the callbacks the kit pushes changes through.
   * @returns the host's session and `detach`.
   * @throws DevtoolsError `host_attached` while another host is attached.
   */
  attach(host: DevtoolsHost): DevtoolsAttachment {
    if (this.host !== undefined)
      throw new DevtoolsError(
        "host_attached",
        `devtools host "${host.name}" cannot attach: "${this.host.name}" is attached`,
      );
    this.host = host;
    let attached = true;
    const check = () => {
      if (!attached)
        throw new DevtoolsError("detached", `devtools host "${host.name}" has detached`);
    };
    const visible = (id: string) => {
      const tab = this.tabById.get(id);
      return tab && (!tab.sensitive || host.acceptsSensitive === true) ? tab : undefined;
    };
    const session: DevtoolsSession = Object.freeze({
      tabs: () => {
        check();
        return this.sortedTabs(host.acceptsSensitive === true);
      },
      readTab: async (id: string) => {
        check();
        const tab = visible(id);
        if (!tab) throw new DevtoolsError("unknown_tab", `no devtools tab "${id}"`);
        return await tab.read();
      },
      rpcNames: () => {
        check();
        return this.rpcNames();
      },
      call: async (name: string, ...args: readonly unknown[]) => {
        check();
        const handler = this.rpcByName.get(name);
        if (!handler) throw new DevtoolsError("unknown_rpc", `no devtools RPC "${name}"`);
        return await handler(...args);
      },
      replay: (channel?: string) => {
        check();
        return channel === undefined
          ? [...this.buffer]
          : this.buffer.filter((event) => event.channel === channel);
      },
    });
    return Object.freeze({
      session,
      detach: () => {
        if (!attached) return;
        attached = false;
        if (this.host === host) this.host = undefined;
      },
    });
  }

  /** The tabs' metadata, sorted; sensitive ones only when `withSensitive`. */
  private sortedTabs(withSensitive: boolean): readonly DevtoolsTabMetadata[] {
    return [...this.tabById.values()]
      .filter((tab) => withSensitive || !tab.sensitive)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map(metadataOf);
  }

  /** Tells the attached host its visible tabs. */
  private tabsChanged(): void {
    const host = this.host;
    if (host?.onTabsChanged)
      isolated(() => host.onTabsChanged?.(this.sortedTabs(host.acceptsSensitive === true)));
  }

  /** Tells the attached host the RPC names. */
  private rpcChanged(): void {
    const host = this.host;
    if (host?.onRpcChanged) isolated(() => host.onRpcChanged?.(this.rpcNames()));
  }
}
