/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `SecretStore` port: an abstract class that extends `Port`, is its own DI token,
 *          is implemented with `Driver(SecretStore)`, and resolves one name at a time.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16 and
 *                     17); ADR 0173.
 */
import { Container, Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SecretStore } from "#core/ports/secret-store.port";

class RecordSecretStoreDriver extends Driver(SecretStore) {
  get(name: string): string | undefined {
    return name === "RESEND_API_KEY" ? "re_test" : undefined;
  }
}

describe("SecretStore", () => {
  it("is a port", () => {
    expect(SecretStore.prototype).toBeInstanceOf(Port);
    expectTypeOf<SecretStore["~kind"]>().toEqualTypeOf<"port">();
    expectTypeOf<SecretStore["get"]>().toEqualTypeOf<(name: string) => string | undefined>();
  });

  it("is its own token, resolved to the driver bound for it", async () => {
    const driver = new RecordSecretStoreDriver();
    const container = await Container.create([], { overrides: new Map([[SecretStore, driver]]) });
    expect(container.get(SecretStore)).toBe(driver);
    expect(container.get(SecretStore).get("RESEND_API_KEY")).toBe("re_test");
    expect(container.get(SecretStore).get("UNKNOWN")).toBeUndefined();
  });

  it("cannot be constructed itself", () => {
    // @ts-expect-error -- SecretStore is abstract; bind a driver
    expect(new SecretStore()).toBeInstanceOf(Port);
  });
});
