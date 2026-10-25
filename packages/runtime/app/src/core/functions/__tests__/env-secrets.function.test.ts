/**
 * Stackra file contract:
 * Purpose: unit tests of `envSecrets`: it is a `SecretStore`, answers a set name from the environment, and treats an
 *          unset name, an empty string and a non-string binding as absent.
 * Boundary: test only; uses placeholder values, never a real secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173.
 */
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";

import { envSecrets } from "#core/functions/env-secrets.function";

describe("envSecrets", () => {
  const store = envSecrets({ RESEND_API_KEY: "re_test", EMPTY_KEY: "", BUCKET: { binding: true } });

  it("is a SecretStore", () => {
    expect(store).toBeInstanceOf(SecretStore);
  });

  it("answers a set name", () => {
    expect(store.get("RESEND_API_KEY")).toBe("re_test");
  });

  it("treats unset, empty and non-string values as absent", () => {
    expect(store.get("MISSING_KEY")).toBeUndefined();
    expect(store.get("EMPTY_KEY")).toBeUndefined();
    expect(store.get("BUCKET")).toBeUndefined();
  });
});
