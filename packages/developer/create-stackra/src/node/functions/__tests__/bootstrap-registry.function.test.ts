/**
 * Stackra file contract:
 * Purpose: unit tests of `bootstrapRegistry`: the flag wins, then `STACKRA_REGISTRY`, then the default; the origin
 *          ends in `/`; anything but an http(s) URL is refused.
 * Boundary: pure function under test.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 1); ADR 0022 (test placement).
 */
import { BootstrapUsageError } from "#node/errors/bootstrap-usage.error";
import { bootstrapRegistry } from "#node/functions/bootstrap-registry.function";

describe("bootstrapRegistry", () => {
  it("takes the flag, else STACKRA_REGISTRY, else the Stackra registry", () => {
    expect(bootstrapRegistry(undefined, {})).toBe("https://npm.stackra.figentra.com/");
    expect(bootstrapRegistry(undefined, { STACKRA_REGISTRY: "https://env.test" })).toBe(
      "https://env.test/",
    );
    expect(
      bootstrapRegistry("http://localhost:8787", { STACKRA_REGISTRY: "https://env.test" }),
    ).toBe("http://localhost:8787/");
  });

  it("refuses a value that is not an http or https URL", () => {
    expect(() => bootstrapRegistry("not a url", {})).toThrow(BootstrapUsageError);
    expect(() => bootstrapRegistry(undefined, { STACKRA_REGISTRY: "file:///tmp/r" })).toThrow(
      "the registry is not an http(s) URL: file:///tmp/r",
    );
  });
});
