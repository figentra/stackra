/**
 * Stackra file contract:
 * Purpose: unit tests of `registerTestingPlugin`, the builder extension point: a plugin adds a chain method (here a
 *          stand-in for config's `.withConfig`) and an app member, may queue work with `onCompile`, may be registered
 *          again under its name, and may not take a member the builder, the app or another plugin already has.
 * Boundary: test only; the plugin below stands in for the ones @stackra/config, actions and integrations ship, and
 *           declares its members by declaration merging as they will.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { type AnyClass, Module } from "#core/index";
import { REGISTERED_WIRINGS } from "#testing/constants/registered-wirings.constant";
import { TESTING_PLUGINS } from "#testing/constants/testing-plugins.constant";
import { createTestingModule } from "#testing/functions/create-testing-module.function";
import { registerTestingPlugin } from "#testing/functions/register-testing-plugin.function";
import { registerWiring } from "#testing/functions/register-wiring.function";
import { TestingModuleBuilder } from "#testing/services/testing-module-builder.service";

declare module "#testing/services/testing-module-builder.service" {
  interface TestingModuleBuilder {
    /** The stand-in for @stackra/config's `.withConfig`. */
    withValues(type: AnyClass, values: object): this;
  }
}

declare module "#testing/services/testing-app.service" {
  interface TestingApp {
    /** The stand-in for a package's app member. */
    readonly greetings: string[];
  }
}

class GreetingConfig {
  text = "hello";
}

class GreetingModule extends Module {}

const plugin = {
  name: "@stackra/greeting",
  builder: {
    withValues(this: TestingModuleBuilder, type: AnyClass, values: object) {
      const Type = type as unknown as new () => object;
      const instance = Object.assign(new Type(), values);
      return this.override(type, instance).onCompile((app) => {
        app.greetings.push("compiled");
      });
    },
  },
  app: () => ({ greetings: [] as string[] }),
};

beforeEach(() => {
  REGISTERED_WIRINGS.clear();
  for (const registered of TESTING_PLUGINS.values())
    for (const method of Object.keys(registered.builder ?? {}))
      Reflect.deleteProperty(TestingModuleBuilder.prototype, method);
  TESTING_PLUGINS.clear();
  registerWiring({
    member: "greeting",
    root: GreetingModule,
    config: [{ key: "greeting", provide: GreetingConfig }],
  });
});

describe("registerTestingPlugin", () => {
  it("adds a chain method and an app member, and runs queued work at compile", async () => {
    registerTestingPlugin(plugin);
    const app = await createTestingModule(GreetingModule)
      .withValues(GreetingConfig, { text: "hi" })
      .compile();
    expect(app.get(GreetingConfig).text).toBe("hi");
    expect(app.greetings).toEqual(["compiled"]);
  });

  it("may be registered again under the same name", () => {
    registerTestingPlugin(plugin);
    expect(() => registerTestingPlugin(plugin)).not.toThrow();
  });

  it("refuses a method the builder or another plugin already has", () => {
    registerTestingPlugin(plugin);
    expect(() =>
      registerTestingPlugin({ name: "@stackra/other", builder: plugin.builder }),
    ).toThrow(TypeError);
    expect(() =>
      registerTestingPlugin({ name: "@stackra/compile", builder: { compile: () => undefined } }),
    ).toThrow(/already has it/);
  });

  it("refuses an app member the testing app already has", async () => {
    registerTestingPlugin({ name: "@stackra/modules", app: () => ({ modules: [] }) });
    await expect(createTestingModule(GreetingModule).compile()).rejects.toThrow(/app.modules/);
  });
});
