/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/container` (with
 *          the 2026-10-24 moves: Module and Service here, Port in contracts) and the kind helpers the kind packages
 *          need are exported, nothing else is, nothing retired (`Injectable`, `Inject`, `defineToken`, `Provider`) is,
 *          every type the template imports resolves, and the package carries no reflect-metadata dependency.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and reads package.json from disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note;
 *                     ADR 0227 2026-10-24 note.
 */
import { readFileSync } from "node:fs";

import type { Clock, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import * as container from "#core/index";
import type {
  AnyClass,
  ContainerBindingEntry,
  ContainerOptions,
  Decorator,
  DecoratorDefinition,
  DecoratorFunction,
  DiscoveredClass,
  DriverChoice,
  DriverClass,
  DriverName,
  DriverRegistry,
  KindRecord,
  ModuleClass,
  ModuleOptions,
  Named,
  NamedToken,
  Token,
  Wiring,
  WiringBinding,
  WiringConfig,
  WiringDriver,
  WiringModule,
  WiringReplacement,
  WithPartner,
} from "#core/index";

/** Every type the entry exports; this alias fails to compile if one stops resolving. */
type EntryTypes = [
  AnyClass,
  ContainerBindingEntry,
  ContainerOptions,
  container.Container,
  Decorator<string>,
  DecoratorDefinition,
  DecoratorFunction,
  DiscoveredClass<string>,
  DriverChoice,
  DriverClass<AnyClass<Port>>,
  DriverName<Port>,
  DriverRegistry,
  KindRecord,
  container.Lifetime,
  ModuleClass,
  ModuleOptions,
  Named<Clock, "x">,
  NamedToken,
  Token,
  Wiring,
  WiringBinding,
  WiringConfig,
  WiringDriver,
  WiringModule,
  WiringReplacement,
  WithPartner<never, object, "hint">,
];

describe("@stackra/container", () => {
  it("exports exactly the DI and kind machinery", () => {
    expect(Object.keys(container).sort()).toEqual([
      "Container",
      "DecoratorTarget",
      "DiscoveryService",
      "Driver",
      "Explorer",
      "Lifetime",
      "Module",
      "Replaces",
      "Service",
      "UnresolvedPortError",
      "createDecorator",
      "createKind",
      "kindOf",
      "named",
      "registerKind",
    ]);
  });

  it("exports nothing retired", () => {
    for (const retired of ["Injectable", "Inject", "defineToken", "Provider", "defineKind", "Port"])
      expect(retired in container).toBe(false);
  });

  it("exports every type the template imports", () => {
    const types: EntryTypes | undefined = undefined;
    expect(types).toBeUndefined();
  });

  it("depends on contracts only, with no reflect-metadata", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(["@stackra/contracts"]);
    expect({ ...manifest.dependencies, ...manifest.devDependencies }).not.toHaveProperty(
      "reflect-metadata",
    );
  });
});
