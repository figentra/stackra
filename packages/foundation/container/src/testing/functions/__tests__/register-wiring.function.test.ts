/**
 * Stackra file contract:
 * Purpose: unit tests of `registerWiring`: a registered wiring is what a testing module boots, and registering a
 *          member again replaces its wiring and moves it last, so its rows win.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0263 (decisions 11 and 12).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Module, Service, type Wiring } from "#core/index";
import { REGISTERED_WIRINGS } from "#testing/constants/registered-wirings.constant";
import { createTestingModule } from "#testing/functions/create-testing-module.function";
import { registerWiring } from "#testing/functions/register-wiring.function";

class GreetingConfig {
  text = "hello";
}

class LoudGreetingConfig extends GreetingConfig {
  override text = "HELLO";
}

class GreetingModule extends Module {}

const greeting = (override?: typeof GreetingConfig): Wiring => ({
  member: "greeting",
  root: GreetingModule,
  config: [
    override === undefined
      ? { key: "greeting", provide: GreetingConfig }
      : { key: "greeting", provide: GreetingConfig, override },
  ],
});

beforeEach(() => {
  REGISTERED_WIRINGS.clear();
});

describe("registerWiring", () => {
  it("makes a wiring available to testing modules", async () => {
    registerWiring(greeting());
    const app = await createTestingModule(GreetingModule).compile();
    expect(app.get(GreetingConfig).text).toBe("hello");
  });

  it("replaces a member's wiring and moves it last", async () => {
    class Other extends Service {}
    registerWiring(greeting());
    registerWiring({ member: "other", bindings: [{ module: "other", provide: Other, deps: [] }] });
    registerWiring(greeting(LoudGreetingConfig));
    expect([...REGISTERED_WIRINGS.keys()]).toEqual(["other", "greeting"]);
    const app = await createTestingModule(GreetingModule).compile();
    expect(app.get(GreetingConfig).text).toBe("HELLO");
  });
});
