/**
 * Stackra file contract:
 * Purpose: `TestingModuleBuilder`, the chain `createTestingModule` returns: `.override(Port, instance)` puts an
 *          instance in a token's place, `.useDrivers(name | map)` picks drivers ahead of config (plugin test drivers
 *          included), and `.compile()` loads the member's generated schemas, boots the registered wirings for the
 *          chosen roots and resolves to a `TestingApp`.
 * Boundary: a replacement is always `.override`, never a provider list, and the real wiring is never edited (ADR 0263
 *           decision 12). Other packages add chain methods through `registerTestingPlugin`; container imports none.
 * Runtime: node
 * Governing contract: ADR 0263 (decision 12); ADR 0269 (decision 3).
 */
import type { Port } from "@stackra/contracts";

import {
  type AnyClass,
  Container,
  type DriverChoice,
  kindOf,
  type ModuleClass,
  type NamedToken,
  type Token,
  type Wiring,
  type WiringDriver,
} from "#core/index";
import { REGISTERED_WIRINGS } from "#testing/constants/registered-wirings.constant";
import { TESTING_PLUGINS } from "#testing/constants/testing-plugins.constant";
import { loadMemberSchemas } from "#testing/functions/load-member-schemas.function";
import { TestingApp } from "#testing/services/testing-app.service";
import type { ModuleRecord } from "#testing/types/module-record.type";

/** A module key guessed from a class no wiring names: `FixtureModule` is `fixture`. */
const keyOf = (type: ModuleClass) =>
  type.name
    .replace(/Module$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();

/** The modules each root boots: its wiring's own modules, its own wiring row, or the class itself. */
function recordsOf(roots: readonly ModuleClass[], wirings: readonly Wiring[]): ModuleRecord[] {
  const records = new Map<string, ModuleRecord>();
  for (const root of roots) {
    const wiring = wirings.find((candidate) => candidate.root === root);
    if (wiring !== undefined) {
      for (const [key, entry] of Object.entries(wiring.modules ?? {}))
        if (entry.from === undefined && !records.has(key))
          records.set(key, {
            key,
            type: entry.type ?? (key === wiring.member ? root : undefined),
            exports: entry.exports,
            dependsOn: entry.dependsOn,
          });
      continue;
    }
    const row = wirings
      .flatMap((candidate) => Object.entries(candidate.modules ?? {}))
      .find(([, entry]) => entry.type === root);
    const key = row?.[0] ?? keyOf(root);
    if (!records.has(key))
      records.set(key, {
        key,
        type: root,
        exports:
          row?.[1].exports ?? ((kindOf(root)?.options["exports"] ?? []) as readonly AnyClass[]),
        dependsOn: row?.[1].dependsOn ?? [],
      });
  }
  return [...records.values()];
}

/** The driver name the test picked for `driver`'s port, as the container matches it: port key, class, member, fallback. */
function pickedFor(driver: WiringDriver, choice: DriverChoice): string | undefined {
  const byPort = choice.byPort ?? {};
  const member = driver.key?.split(".")[0];
  return (
    (driver.key === undefined ? undefined : byPort[driver.key]) ??
    byPort[driver.port.name] ??
    (member === undefined ? undefined : byPort[member]) ??
    choice.fallback
  );
}

/** The plugins' test drivers the test picked, each with only its picked candidate, as one wiring. */
function pickedDrivers(choice: DriverChoice): Wiring[] {
  const drivers = [...TESTING_PLUGINS.values()].flatMap((plugin) =>
    (plugin.drivers ?? []).flatMap((driver) => {
      const name = pickedFor(driver, choice);
      const load = name === undefined ? undefined : driver.candidates[name];
      return name === undefined || load === undefined
        ? []
        : [{ ...driver, candidates: { [name]: load } }];
    }),
  );
  return drivers.length === 0 ? [] : [{ member: "@stackra/container/testing", drivers }];
}

/**
 * The testing-module chain.
 *
 * @example
 * const app = await createTestingModule(LoyaltyKitModule)
 *   .override(LoyaltyMembers, LoyaltyMembersFake.with([]))
 *   .useDrivers("memory")
 *   .compile();
 */
export class TestingModuleBuilder {
  /** The modules to boot. */
  private readonly roots: readonly ModuleClass[];

  /** Instances put in the place of their tokens. */
  private readonly overrides = new Map<Token, object>();

  /** Driver names per port key, member key or port class name. */
  private readonly byPort: Record<string, string> = {};

  /** The driver name every port with such a candidate takes. */
  private fallback: string | undefined;

  /** Work run on the compiled app, in order, before `compile()` resolves. */
  private readonly steps: ((app: TestingApp) => void | Promise<void>)[] = [];

  /**
   * @param roots - the modules to boot.
   */
  constructor(roots: readonly ModuleClass[]) {
    this.roots = roots;
  }

  /** Puts `instance` in the place of `token` for every class that injects it. */
  override<T extends object>(token: AnyClass<T>, instance: T): this;

  /** Puts `instance` in the place of the instance of `P` named `N`. */
  override<P extends Port, N extends string>(token: NamedToken<P, N>, instance: P): this;

  /** Records the instance for either overload; the last call for a token wins. */
  override(token: Token, instance: object): this {
    this.overrides.set(token, instance);
    return this;
  }

  /**
   * Picks drivers ahead of config: a name every port with such a driver takes (`"memory"`), or names per port key,
   * member key or port class name (`{ database: "postgres", queue: "memory" }`). Calls add up; an override wins.
   */
  useDrivers(choice: string | Readonly<Record<string, string>>): this {
    if (typeof choice === "string") this.fallback = choice;
    else Object.assign(this.byPort, choice);
    return this;
  }

  /** Runs `step` on the compiled app before `compile()` resolves; the hook plugin methods such as `.seed` use. */
  onCompile(step: (app: TestingApp) => void | Promise<void>): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Loads the member's generated schemas, boots every registered wiring for the roots (after the plugins' picked test
   * drivers, so a registered candidate of the same name wins), adds the plugins' app members and runs the `onCompile`
   * steps.
   *
   * @throws UnresolvedPortError when a port has no driver and nothing overrides it.
   */
  async compile(): Promise<TestingApp> {
    await loadMemberSchemas();
    const wirings = [...REGISTERED_WIRINGS.values()];
    const drivers: DriverChoice =
      this.fallback === undefined
        ? { byPort: { ...this.byPort } }
        : { fallback: this.fallback, byPort: { ...this.byPort } };
    const container = await Container.create([...pickedDrivers(drivers), ...wirings], {
      roots: this.roots,
      overrides: new Map(this.overrides),
      drivers,
    });
    const app = new TestingApp(container, recordsOf(this.roots, wirings));
    for (const plugin of TESTING_PLUGINS.values())
      for (const [member, value] of Object.entries(plugin.app?.(app) ?? {})) {
        if (member in app)
          throw new TypeError(
            `${plugin.name} cannot add app.${member}: the testing app already has it`,
          );
        Object.defineProperty(app, member, { value, enumerable: true });
      }
    for (const step of this.steps) await step(app);
    return app;
  }
}
