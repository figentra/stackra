/**
 * Stackra file contract:
 * Purpose: `Container`, the DI container: it merges the generated wirings of a member and its dependencies, loads the
 *          selected driver of every port, builds each binding with the constructor tokens gen read from its declared
 *          parameter types, keeps singletons per container and request instances per `forRequest()`, runs every
 *          Explorer once, shuts instances down on `close()`, and answers `getAll(Base)`, the multi-binding: every
 *          booted class that extends a base another module owns (a guard contributed to a checkout gate). `bindings()`
 *          lists what it can build by name (token, scope, lifetime, class) for tooling, never an instance.
 * Boundary: classes (and `named(Port, "x")`) are the only tokens; no reflect-metadata, no `design:paramtypes`, no
 *           string token (ADR 0227 2026-10-24 note). Config values are not layered here: @stackra/config builds the
 *           config instances and passes them as overrides. A port nobody binds fails `create` with
 *           `UnresolvedPortError`, so a missing driver is a boot failure, never a runtime `undefined`; a candidate whose
 *           lazy import gives no class fails it with a TypeError naming the driver and its port. A contribution
 *           is found by subclassing its base, which is still a class token: no string, no array token, no new
 *           wiring section (ADR 0457).
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (decisions 1, 5, 9, 11 and 12); ADR 0294 (decisions 17 and 19); ADR 0143 as amended by
 *                     0263 (lifetimes and lifecycle); ADR 0144 as amended by 0263 (Explorers); ADR 0457
 *                     (multi-binding extension points).
 */
import { Clock, Port } from "@stackra/contracts";

import { Explorer } from "#core/bases/explorer.base";
import { Lifetime } from "#core/decorators/lifetime.decorator";
import { SystemClockDriver } from "#core/drivers/system-clock.driver";
import { UnresolvedPortError } from "#core/errors/unresolved-port.error";
import { kindOf } from "#core/functions/kind-of.function";
import { named } from "#core/functions/named.function";
import { DiscoveryService } from "#core/services/discovery.service";
import type { AnyClass } from "#core/types/any-class.type";
import type { ContainerBindingEntry } from "#core/types/container-binding-entry.type";
import type { ContainerOptions } from "#core/types/container-options.type";
import type { DriverChoice } from "#core/types/driver-choice.type";
import type { ModuleClass } from "#core/types/module-class.type";
import type { Named } from "#core/types/named.type";
import type { NamedToken } from "#core/types/named-token.type";
import type { Token } from "#core/types/token.type";
import type { Wiring } from "#core/types/wiring.type";
import type { WiringBinding } from "#core/types/wiring-binding.type";

/** How one token is built: the class, its lifetime and its constructor tokens, or a built-in's factory. */
interface Recipe {
  readonly type: AnyClass;
  readonly lifetime: Lifetime;
  readonly deps: readonly Token[];
  readonly create?: (container: Container) => object;
}

/** A recipe with the token its instance is cached under (a port for its driver, the base for a config override). */
interface KeyedRecipe extends Recipe {
  readonly key: Token;
}

/** The driver table of one port, merged across wirings. */
interface MergedDriver {
  readonly port: AnyClass<Port>;
  key: string | undefined;
  selectedBy: string | undefined;
  named: string | undefined;
  readonly candidates: Record<string, () => Promise<AnyClass<Port>>>;
  readonly deps: Record<string, readonly Token[]>;
}

/** One config class, merged across wirings. */
interface MergedConfig {
  readonly key: string;
  readonly provide: AnyClass;
  override: AnyClass | undefined;
}

/** The merged wirings, shared by a container and its request containers. */
interface Graph {
  readonly wirings: readonly Wiring[];
  readonly modules: Map<
    string,
    { readonly dependsOn: readonly string[]; type: ModuleClass | undefined }
  >;
  readonly bindings: Map<AnyClass, WiringBinding>;
  readonly configs: Map<string, MergedConfig>;
  readonly configByToken: Map<AnyClass, MergedConfig>;
  readonly drivers: Map<AnyClass, MergedDriver>;
  readonly replaces: Map<AnyClass, AnyClass>;
  readonly overrides: ReadonlyMap<Token, object>;
  readonly loaded: Map<Token, Recipe>;
  readonly exported: Set<AnyClass>;
  /** The module keys `create` booted, or undefined when it booted every wiring's root. */
  booted: ReadonlySet<string> | undefined;
}

/** Whether a token is a named token rather than a class. */
const isNamed = (token: Token): token is NamedToken => typeof token === "object";

/** A token as an error message names it. */
const nameOf = (token: Token) =>
  isNamed(token) ? `named(${token.port.name}, "${token.name}")` : token.name;

/**
 * The class a driver candidate's lazy import gives, or a TypeError naming the driver and its port when it gives none
 * (the entry does not export the class the wiring names, or a circular import left it undefined).
 */
async function loadedClass(
  driver: MergedDriver,
  name: string,
  load: () => Promise<AnyClass<Port>>,
): Promise<AnyClass<Port>> {
  const type: unknown = await load();
  if (typeof type !== "function")
    throw new TypeError(
      `The "${name}" driver of ${driver.port.name}${driver.key === undefined ? "" : ` (${driver.key})`} loaded ` +
        `${String(type)}: the entry its wiring imports does not export that class, or a circular import left it ` +
        "undefined",
    );
  return type as AnyClass<Port>;
}

/** Merges wirings in order; a later wiring (the host's) wins over an earlier one (a dependency's). */
function mergeWirings(wirings: readonly Wiring[], overrides: ReadonlyMap<Token, object>): Graph {
  const graph: Graph = {
    wirings,
    modules: new Map(),
    bindings: new Map(),
    configs: new Map(),
    configByToken: new Map(),
    drivers: new Map(),
    replaces: new Map(),
    overrides,
    loaded: new Map(),
    exported: new Set(),
    booted: undefined,
  };
  for (const wiring of wirings) {
    for (const [key, entry] of Object.entries(wiring.modules ?? {}))
      graph.modules.set(key, {
        dependsOn: entry.dependsOn,
        type: entry.type ?? graph.modules.get(key)?.type,
      });
    for (const binding of wiring.bindings ?? []) graph.bindings.set(binding.provide, binding);
    for (const entry of wiring.config ?? []) {
      const config = graph.configs.get(entry.key) ?? {
        key: entry.key,
        provide: entry.provide,
        override: undefined,
      };
      config.override = entry.override ?? config.override;
      graph.configs.set(entry.key, config);
    }
    for (const entry of wiring.drivers ?? []) {
      const driver = graph.drivers.get(entry.port) ?? {
        port: entry.port,
        key: undefined,
        selectedBy: undefined,
        named: undefined,
        candidates: {},
        deps: {},
      };
      driver.key = entry.key ?? driver.key;
      driver.selectedBy = entry.selectedBy ?? driver.selectedBy;
      driver.named = entry.named ?? driver.named;
      Object.assign(driver.candidates, entry.candidates);
      Object.assign(driver.deps, entry.deps);
      graph.drivers.set(entry.port, driver);
    }
    for (const entry of wiring.replaces ?? []) graph.replaces.set(entry.provide, entry.override);
  }
  for (const config of graph.configs.values()) {
    graph.configByToken.set(config.provide, config);
    if (config.override !== undefined) graph.configByToken.set(config.override, config);
  }
  return graph;
}

/** The module classes reachable from `roots` through `imports`, roots first. */
function closureOf(roots: readonly ModuleClass[]): ModuleClass[] {
  const seen = new Set<ModuleClass>();
  const visit = (type: ModuleClass): void => {
    if (seen.has(type)) return;
    seen.add(type);
    for (const imported of (kindOf(type)?.options["imports"] ?? []) as readonly ModuleClass[])
      visit(imported);
  };
  for (const root of roots) visit(root);
  return [...seen];
}

/**
 * The DI container. Built by `Container.create` (the runtime's `createApp`, or the testing module), then read by
 * class.
 *
 * @example
 * const container = await Container.create([wiring], { overrides: new Map([[LoyaltyKitConfig, config]]) });
 * container.get(LoyaltyService).quote(member, 100, 10_000);
 */
// oxlint-disable-next-line stackra/base-matches-suffix -- reason: the container builds every Service, so it cannot be one; it is the runtime class the `.service.ts` folder rule names (ADR 0294 kind table)
export class Container {
  /** The merged wirings and the loaded drivers, shared with request containers. */
  private readonly graph: Graph;

  /** The root container, or undefined for the root itself. */
  private readonly root: Container | undefined;

  /** This container's cached instances: singletons on the root, request instances on a request container. */
  private readonly cache = new Map<Token, object>();

  /** This container's cached instances in build order, for discovery and shutdown. */
  private readonly built: object[] = [];

  /** The tokens being built, innermost last, to report a dependency cycle. */
  private readonly resolving: Token[] = [];

  private constructor(graph: Graph, root: Container | undefined) {
    this.graph = graph;
    this.root = root;
  }

  /**
   * Boots a container: merges `wirings` (dependencies first, the member last), loads the selected driver of every
   * port, builds every singleton binding of the booted modules and the classes their module files export, then runs
   * each Explorer's `onApplicationBootstrap()` once.
   *
   * @throws UnresolvedPortError when a port has no driver to load and nothing overrides or replaces it.
   * @throws Error on a dependency cycle, or when a binding needs a class nothing binds.
   */
  static async create(
    wirings: readonly Wiring[],
    options: ContainerOptions = {},
  ): Promise<Container> {
    const graph = mergeWirings(wirings, options.overrides ?? new Map());
    const container = new Container(graph, undefined);
    const roots =
      options.roots ??
      wirings.flatMap((wiring) => (typeof wiring.root === "function" ? [wiring.root] : []));
    const closure = closureOf(roots);
    for (const type of closure)
      for (const exported of (kindOf(type)?.options["exports"] ?? []) as readonly AnyClass[])
        graph.exported.add(exported);
    await container.loadDrivers(options.drivers ?? {});
    const keys = options.roots === undefined ? undefined : container.modulesOf(closure);
    graph.booted = keys;
    for (const binding of graph.bindings.values())
      if (keys === undefined || keys.has(binding.module))
        if (container.recipeFor(binding.provide).lifetime === Lifetime.Singleton)
          container.resolve(binding.provide);
    for (const exported of graph.exported)
      if (container.recipeOf(exported).lifetime === Lifetime.Singleton) container.resolve(exported);
    // A snapshot: an explorer may build more instances while it bootstraps.
    // oxlint-disable-next-line unicorn/no-useless-spread -- the copy is the snapshot; the loop body grows `built`
    for (const instance of [...container.built])
      if (instance instanceof Explorer) await instance.onApplicationBootstrap();
    return container;
  }

  /**
   * The instance for a class, or for a named instance of a port.
   *
   * @throws UnresolvedPortError for a port with no driver.
   * @throws Error for a class nothing binds, a cycle, or a `Lifetime.Request` binding read outside `forRequest()`.
   */
  get<T extends object>(token: AnyClass<T>): T;

  /** The instance of `P` that config names `N`. */
  get<P extends Port, N extends string>(token: NamedToken<P, N>): Named<P, N>;

  /** Resolves either overload through the one recipe lookup. */
  get(token: Token): object {
    return this.resolve(token);
  }

  /**
   * Every class the booted modules bind or export that extends `base`, built (or read from cache) in wiring order:
   * dependencies first, the host last. This is the multi-binding: the module that owns an extension point declares
   * an abstract base, and each module that contributes to it binds a subclass. `base` itself is never in the list.
   *
   * @throws Error when a contribution has `Lifetime.Request` and this is not a `forRequest()` container.
   * @example
   * for (const guard of container.getAll(CheckoutGuard)) await guard.check(cart);
   */
  getAll<T extends object>(base: AnyClass<T>): T[] {
    const { graph } = this;
    const types = new Set<AnyClass>();
    for (const binding of graph.bindings.values())
      if (graph.booted === undefined || graph.booted.has(binding.module))
        types.add(binding.provide);
    for (const exported of graph.exported) types.add(exported);
    return [...types]
      .filter((type) => type.prototype instanceof base)
      .map((type) => this.resolve(type) as T);
  }

  /** Whether the container binds `token`: an override, a loaded driver, a config class, a binding or a built-in. */
  has(token: Token): boolean {
    if (this.graph.overrides.has(token)) return true;
    try {
      this.recipeOf(token);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * What the container can build, as names, for tooling such as the devtools tab: each booted binding and exported
   * class, each loaded driver and named instance, and each config class, with its scope, lifetime and the class built.
   * Read-only, and never an instance: nothing is built to answer it.
   *
   * @example
   * container.bindings(); // [{ token: "LoyaltyService", scope: "loyalty", lifetime: "singleton", implementation: "LoyaltyService" }]
   */
  bindings(): readonly ContainerBindingEntry[] {
    const { graph } = this;
    const rows: ContainerBindingEntry[] = [];
    const add = (token: Token, scope: string, recipe: Recipe) =>
      rows.push(
        Object.freeze({
          token: nameOf(token),
          scope,
          lifetime: recipe.lifetime,
          implementation: recipe.type.name,
        }),
      );
    for (const binding of graph.bindings.values())
      if (graph.booted === undefined || graph.booted.has(binding.module))
        add(binding.provide, binding.module, this.recipeOf(binding.provide));
    for (const exported of graph.exported)
      if (!graph.bindings.has(exported)) add(exported, "exported", this.recipeOf(exported));
    for (const [token, recipe] of graph.loaded) {
      const port = isNamed(token) ? token.port : token;
      add(token, graph.drivers.get(port)?.key ?? port.name, recipe);
    }
    for (const config of graph.configs.values())
      add(config.provide, config.key, this.recipeFor(config.override ?? config.provide));
    return Object.freeze(rows);
  }

  /** A container for one request: it shares the singletons and keeps its own `Lifetime.Request` instances. */
  forRequest(): Container {
    return new Container(this.graph, this.root ?? this);
  }

  /** The singletons the root container has built, in build order. */
  instances(): readonly object[] {
    return [...(this.root ?? this).built];
  }

  /**
   * Calls `onApplicationShutdown()` on every instance this container built that has one, last built first, and
   * forgets them. Overrides belong to whoever passed them and are left alone.
   */
  async close(): Promise<void> {
    // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
    const built = this.built.splice(0).reverse();
    this.cache.clear();
    for (const instance of built) {
      const shutdown = (instance as { onApplicationShutdown?: unknown }).onApplicationShutdown;
      if (typeof shutdown === "function") await (shutdown as () => unknown).call(instance);
    }
  }

  /** Builds or returns the instance of `token`, honouring its lifetime. */
  private resolve(token: Token): object {
    const early = this.graph.overrides.get(token);
    if (early !== undefined) return early;
    const recipe = this.recipeOf(token);
    const override = this.graph.overrides.get(recipe.key);
    if (override !== undefined) return override;
    if (recipe.lifetime === Lifetime.Singleton && this.root !== undefined)
      return this.root.resolve(recipe.key);
    if (recipe.lifetime === Lifetime.Request && this.root === undefined)
      throw new Error(
        `${nameOf(token)} has Lifetime.Request: resolve it from container.forRequest()`,
      );
    const cached = this.cache.get(recipe.key);
    if (cached !== undefined) return cached;
    if (this.resolving.includes(recipe.key))
      throw new Error(
        `Dependency cycle: ${[...this.resolving, recipe.key].map(nameOf).join(" -> ")}`,
      );
    this.resolving.push(recipe.key);
    try {
      const instance =
        recipe.create === undefined
          ? (Reflect.construct(
              recipe.type,
              recipe.deps.map((dependency) => this.resolve(dependency)),
            ) as object)
          : recipe.create(this);
      if (recipe.lifetime !== Lifetime.Transient) {
        this.cache.set(recipe.key, instance);
        this.built.push(instance);
      }
      return instance;
    } finally {
      this.resolving.pop();
    }
  }

  /** How `token` is built, and the token its instance is cached under. */
  private recipeOf(token: Token): KeyedRecipe {
    const { graph } = this;
    if (isNamed(token)) {
      const loaded = graph.loaded.get(token);
      // A name config does not declare is the port's default instance: a host that runs one driver has one ledger.
      return loaded === undefined ? this.recipeOf(token.port) : { key: token, ...loaded };
    }
    // An overridden token is never built: `resolve` returns the override cached under this key.
    if (graph.overrides.has(token))
      return { key: token, type: token, lifetime: Lifetime.Singleton, deps: [] };
    const config = graph.configByToken.get(token);
    if (config !== undefined)
      return { key: config.provide, ...this.recipeFor(config.override ?? config.provide) };
    const replacement = graph.replaces.get(token);
    if (replacement !== undefined) return { key: token, ...this.recipeFor(replacement) };
    const driver = graph.loaded.get(token);
    if (driver !== undefined) return { key: token, ...driver };
    for (const [port, loaded] of graph.loaded)
      if (!isNamed(port) && loaded.type === token) return { key: port, ...loaded };
    if (graph.bindings.has(token) || graph.exported.has(token))
      return { key: token, ...this.recipeFor(token) };
    if (token === DiscoveryService)
      return {
        key: token,
        type: token,
        lifetime: Lifetime.Singleton,
        deps: [],
        create: (container) => new DiscoveryService(container),
      };
    if (token === Clock)
      return { key: token, type: SystemClockDriver, lifetime: Lifetime.Singleton, deps: [] };
    if (token.prototype instanceof Port)
      throw new UnresolvedPortError(
        token as AnyClass<Port>,
        "no wiring lists a driver for it, and nothing overrides or replaces it",
      );
    throw new Error(
      `Nothing binds ${token.name}: it is not in the wiring, not exported by a booted module and not overridden`,
    );
  }

  /** The recipe of a class: its wiring row, else its `@Lifetime` and no dependencies. */
  private recipeFor(type: AnyClass, deps?: readonly Token[]): Recipe {
    const binding = this.graph.bindings.get(type);
    return {
      type,
      lifetime: binding?.lifetime ?? Lifetime.on(type) ?? Lifetime.Singleton,
      deps: deps ?? binding?.deps ?? [],
    };
  }

  /** Loads the driver every port takes, and every named instance config declares. */
  private async loadDrivers(choice: DriverChoice): Promise<void> {
    const { graph } = this;
    for (const driver of graph.drivers.values()) {
      if (graph.overrides.has(driver.port) || graph.replaces.has(driver.port)) continue;
      const name = this.chooseDriver(driver, choice);
      const load = driver.candidates[name];
      if (load !== undefined)
        graph.loaded.set(
          driver.port,
          this.recipeFor(await loadedClass(driver, name, load), driver.deps[name]),
        );
    }
    for (const driver of graph.drivers.values()) {
      if (driver.named === undefined) continue;
      const instances = this.readConfig(driver.named) ?? {};
      if (typeof instances !== "object")
        throw new TypeError(`${driver.named} must be a record of instance name to driver name`);
      for (const [instance, name] of Object.entries(instances)) {
        const token = named(driver.port, instance);
        const load = typeof name === "string" ? driver.candidates[name] : undefined;
        if (graph.overrides.has(token)) continue;
        if (load === undefined)
          throw new UnresolvedPortError(
            driver.port,
            `${driver.named} names ${JSON.stringify(name)} for "${instance}", which is not one of its drivers (${Object.keys(driver.candidates).join(", ")})`,
          );
        graph.loaded.set(
          token,
          this.recipeFor(
            await loadedClass(driver, name as string, load),
            driver.deps[name as string],
          ),
        );
      }
    }
  }

  /** The name of the driver a port takes: the test's choice, then config, then its only candidate. */
  private chooseDriver(driver: MergedDriver, choice: DriverChoice): string {
    const names = Object.keys(driver.candidates);
    const list = names.length === 0 ? "it has no candidate" : `its drivers are ${names.join(", ")}`;
    const byPort = choice.byPort ?? {};
    const exact =
      (driver.key === undefined ? undefined : byPort[driver.key]) ?? byPort[driver.port.name];
    if (exact !== undefined) {
      if (!names.includes(exact))
        throw new UnresolvedPortError(driver.port, `useDrivers names "${exact}", but ${list}`);
      return exact;
    }
    const member = driver.key?.split(".")[0];
    const byMember = member === undefined ? undefined : byPort[member];
    if (byMember !== undefined && names.includes(byMember)) return byMember;
    if (choice.fallback !== undefined && names.includes(choice.fallback)) return choice.fallback;
    if (driver.selectedBy !== undefined) {
      const selected = this.readConfig(driver.selectedBy);
      if (typeof selected !== "string" || !names.includes(selected))
        throw new UnresolvedPortError(
          driver.port,
          `${driver.selectedBy} is ${JSON.stringify(selected)}, but ${list}`,
        );
      return selected;
    }
    const [only] = names;
    if (names.length === 1 && only !== undefined) return only;
    throw new UnresolvedPortError(
      driver.port,
      names.length === 0
        ? "it has no candidate, and nothing overrides or replaces it"
        : `${list}, and no config field selects one`,
    );
  }

  /** The value at `config:<key>.<field>`, read from the config instance of the longest matching key. */
  private readConfig(reference: string): unknown {
    if (!reference.startsWith("config:"))
      throw new TypeError(`"${reference}" is not a config reference (config:<key>.<field>)`);
    const path = reference.slice("config:".length);
    let entry: MergedConfig | undefined;
    for (const config of this.graph.configs.values())
      if (
        (path === config.key || path.startsWith(`${config.key}.`)) &&
        config.key.length > (entry?.key.length ?? -1)
      )
        entry = config;
    if (entry === undefined) throw new Error(`No config class has the key of ${reference}`);
    let value: unknown = this.resolve(entry.provide);
    for (const field of path.slice(entry.key.length + 1).split(".")) {
      if (field === "") continue;
      value =
        value === null || typeof value !== "object"
          ? undefined
          : (value as Record<string, unknown>)[field];
    }
    return value;
  }

  /** The module keys the given module classes boot, with every module they depend on. */
  private modulesOf(closure: readonly ModuleClass[]): Set<string> {
    const keys = new Set<string>();
    const visit = (key: string): void => {
      if (keys.has(key)) return;
      keys.add(key);
      for (const dependency of this.graph.modules.get(key)?.dependsOn ?? []) visit(dependency);
    };
    for (const type of closure) {
      for (const wiring of this.graph.wirings) {
        if (wiring.root !== type) continue;
        for (const key of Object.keys(wiring.modules ?? {})) visit(key);
        for (const binding of wiring.bindings ?? []) visit(binding.module);
      }
      for (const [key, module] of this.graph.modules) if (module.type === type) visit(key);
    }
    return keys;
  }
}
