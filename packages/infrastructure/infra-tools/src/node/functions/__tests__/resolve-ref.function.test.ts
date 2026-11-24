/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveRef`: a literal passes through without touching the config; `ref:<key>` reads a plain
 *          config value and `ref:<key>.<path>` walks a structured one; a number becomes its string; a missing config
 *          key, a path the config does not hold, a path through a value that is not an object and a path that ends on
 *          an object or a boolean each fail, the path ones naming the path and the key.
 * Boundary: test only; the stack config is a small fake with Pulumi's `require` and `requireObject`, so no Pulumi
 *           runtime is installed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4: `ref:` values from the stacks repository).
 */
import type * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import { resolveRef } from "#node/functions/resolve-ref.function";

/** A stack config over `values`, failing on a missing key as Pulumi's does, and recording what it was asked. */
function configOf(values: Record<string, unknown>) {
  const asked: string[] = [];
  const config = {
    require(key: string): string {
      asked.push(key);
      const value = values[key];
      if (typeof value !== "string")
        throw new Error(`Missing required configuration variable '${key}'`);
      return value;
    },
    requireObject<T>(key: string): T {
      asked.push(key);
      if (!(key in values)) throw new Error(`Missing required configuration variable '${key}'`);
      return values[key] as T;
    },
  } as unknown as pulumi.Config;
  return { config, asked };
}

describe("resolveRef", () => {
  it("passes a literal through, without reading the config", () => {
    const { config, asked } = configOf({});
    expect(resolveRef("eu-central-1", config)).toBe("eu-central-1");
    expect(resolveRef("", config)).toBe("");
    expect(asked).toEqual([]);
  });

  it("reads a plain key", () => {
    const { config } = configOf({ billingAccount: "acct-1" });
    expect(resolveRef("ref:billingAccount", config)).toBe("acct-1");
  });

  it("walks a structured key, a number answering as its string", () => {
    const { config, asked } = configOf({
      network: { staging: { subnets: { a: "subnet-0abc" }, mtu: 1500 } },
    });
    expect(resolveRef("ref:network.staging.subnets.a", config)).toBe("subnet-0abc");
    expect(resolveRef("ref:network.staging.mtu", config)).toBe("1500");
    expect(asked).toEqual(["network", "network"]);
  });

  it("fails on a config key the stack does not have", () => {
    const { config } = configOf({});
    expect(() => resolveRef("ref:billingAccount", config)).toThrow(
      "Missing required configuration variable 'billingAccount'",
    );
    expect(() => resolveRef("ref:network.staging", config)).toThrow(
      "Missing required configuration variable 'network'",
    );
  });

  it("fails on a path the config does not hold, naming the path and the key", () => {
    const { config } = configOf({ network: { staging: {} } });
    expect(() => resolveRef("ref:network.staging.vpc", config)).toThrow(
      'ref:network.staging.vpc is not set: put a string or a number at "staging.vpc" under the stack config key "network"',
    );
  });

  it("fails on a path through a value that is not an object, or through null", () => {
    const { config } = configOf({ network: { staging: "flat", empty: null } });
    expect(() => resolveRef("ref:network.staging.vpc", config)).toThrow(/"staging\.vpc"/);
    expect(() => resolveRef("ref:network.empty.vpc", config)).toThrow(/"empty\.vpc"/);
  });

  it("never reads a property of a string: 'length' under a string value is not 4", () => {
    const { config } = configOf({ network: { staging: "flat" } });
    expect(() => resolveRef("ref:network.staging.length", config)).toThrow(/"staging\.length"/);
  });

  it("fails on a path that ends on an object or a boolean, which are not values", () => {
    const { config } = configOf({ network: { staging: { subnets: { a: "x" }, ipv6: true } } });
    expect(() => resolveRef("ref:network.staging.subnets", config)).toThrow(/is not set/);
    expect(() => resolveRef("ref:network.staging.ipv6", config)).toThrow(/is not set/);
  });
});
