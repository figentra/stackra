/**
 * Stackra file contract:
 * Purpose: unit tests of `LoginDirectoryWriterService`: `record` writes one hashed key per identifier ending in this
 *          region (no clear identifier, no repeats), `forget` removes it (a changed email moves the row), an identifier
 *          that does not normalise is skipped without a store call, and the service refuses to start unconfigured.
 * Boundary: test only; the memory store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0353 (decision 4); ADR 0451.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoginDirectoryConfig } from "#config/login-directory.config";
import { LoginIdentifierKind, loginDirectoryPrefix } from "#contracts/index";
import { MemoryLoginDirectoryStoreDriver } from "#core/drivers/memory-login-directory-store.driver";
import { LoginDirectoryWriterService } from "#core/services/login-directory-writer.service";

const settings = { region: "eu", keyId: "k1", secret: "directory-secret" };

/** A writer over a fresh memory store. */
function writerOf(values: Partial<typeof settings> = {}) {
  const store = new MemoryLoginDirectoryStoreDriver();
  const { secret, ...rest } = { ...settings, ...values };
  const secrets = new (class extends SecretStore {
    get(name: string): string | undefined {
      return name === "IDENTITY_LOGIN_DIRECTORY_KEY" && secret !== "" ? secret : undefined;
    }
  })();
  const config = buildConfig(LoginDirectoryConfig, { values: rest, secrets });
  return { store, writer: new LoginDirectoryWriterService(config, store) };
}

const email = (value: string) => ({ kind: LoginIdentifierKind.Email, value });

describe("LoginDirectoryWriterService", () => {
  it("records one hashed key per identifier in this region", async () => {
    const { store, writer } = writerOf();
    expect(await writer.record([email("Ana@Example.com"), email("ana@example.com ")])).toBe(1);
    const prefix = await loginDirectoryPrefix(email("ana@example.com"), {
      id: "k1",
      secret: "directory-secret",
    });
    expect(store.keys()).toEqual([`${prefix}eu`]);
    expect(store.keys().join()).not.toContain("example");
  });

  it("moves the row when an email changes and forgets on delete", async () => {
    const { store, writer } = writerOf();
    await writer.record([
      email("old@example.com"),
      { kind: LoginIdentifierKind.Phone, value: "+971501234567" },
    ]);
    await writer.forget([email("old@example.com")]);
    await writer.record([email("new@example.com")]);
    expect(store.keys()).toHaveLength(2);
    expect(
      await writer.forget([
        email("new@example.com"),
        { kind: LoginIdentifierKind.Phone, value: "+971 50 123 4567" },
      ]),
    ).toBe(2);
    expect(store.keys()).toEqual([]);
  });

  it("skips what does not normalise", async () => {
    const { store, writer } = writerOf();
    expect(await writer.record([email("nobody")])).toBe(0);
    expect(store.keys()).toEqual([]);
  });

  it("refuses to start unconfigured", () => {
    expect(() => writerOf({ secret: "" })).toThrow(TypeError);
    expect(() => writerOf({ region: "" })).toThrow(TypeError);
  });
});
