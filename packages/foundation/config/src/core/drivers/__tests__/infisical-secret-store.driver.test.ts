/**
 * Stackra file contract:
 * Purpose: unit tests of `InfisicalSecretStoreDriver`: it is the `SecretStore` port; `load` signs in with the machine
 *          identity, reads the configured project, environment and folder with the token, and `get` answers from that
 *          copy; a `get` before the load throws; an incomplete configuration, a failed sign-in or a failed read
 *          rejects with the status only, never a value.
 * Boundary: test only; `fetch` is stubbed with a fake Infisical, and every value is a made-up canary.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { InfisicalConfig } from "#config/infisical.config";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { InfisicalSecretStoreDriver } from "#core/drivers/infisical-secret-store.driver";
import { buildConfig } from "#core/functions/build-config.function";

class Platform extends SecretStore {
  get(name: string): string | undefined {
    return { INFISICAL_CLIENT_ID: "id-canary", INFISICAL_CLIENT_SECRET: "secret-canary" }[name];
  }
}

const VALUES = {
  siteUrl: "https://secrets.example.test/",
  projectId: "prj-1",
  environment: "dev",
  path: "/app",
};

function store(values: Record<string, unknown> = VALUES): InfisicalSecretStoreDriver {
  return new InfisicalSecretStoreDriver(
    buildConfig(InfisicalConfig, { values, secrets: new Platform() }),
  );
}

/** A fake Infisical answering the login with `loginStatus` and the read with `readStatus`. */
function infisical(loginStatus = 200, readStatus = 200) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/api/v1/auth/universal-auth/login"))
      return new Response(JSON.stringify({ accessToken: "token-canary" }), { status: loginStatus });
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer token-canary");
    return new Response(
      JSON.stringify({
        secrets: [
          { secretKey: "RESEND_API_KEY", secretValue: "value-canary" },
          { secretKey: "BROKEN", secretValue: 1 },
        ],
      }),
      { status: readStatus },
    );
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(InfisicalSecretStoreDriver, () => {
  it("is a SecretStore that throws before it is loaded", () => {
    const driver = store();
    expect(driver).toBeInstanceOf(SecretStore);
    expect(() => driver.get("RESEND_API_KEY")).toThrow(/not loaded/);
  });

  it("signs in, reads the folder and answers from the copy", async () => {
    const fetch = infisical();
    vi.stubGlobal("fetch", fetch);
    const driver = store();
    await driver.load();
    const [loginUrl, loginInit] = fetch.mock.calls[0] as [string, RequestInit];
    expect(loginUrl).toBe("https://secrets.example.test/api/v1/auth/universal-auth/login");
    expect(JSON.parse(String(loginInit.body))).toEqual({
      clientId: "id-canary",
      clientSecret: "secret-canary",
    });
    const readUrl = new URL((fetch.mock.calls[1] as [string])[0]);
    expect(readUrl.pathname).toBe("/api/v3/secrets/raw");
    expect(Object.fromEntries(readUrl.searchParams)).toMatchObject({
      workspaceId: "prj-1",
      environment: "dev",
      secretPath: "/app",
    });
    expect(driver.get("RESEND_API_KEY")).toBe("value-canary");
    expect(driver.get("BROKEN")).toBeUndefined();
    expect(driver.get("MISSING")).toBeUndefined();
  });

  it("refuses an incomplete configuration and failed calls without a value", async () => {
    await expect(store({}).load()).rejects.toThrow(/needs siteUrl/);
    vi.stubGlobal("fetch", infisical(401));
    await expect(store().load()).rejects.toThrow("Infisical sign-in failed with HTTP 401");
    vi.stubGlobal("fetch", infisical(200, 403));
    const failed = store().load();
    await expect(failed).rejects.toThrow("Infisical secret read failed with HTTP 403");
    await failed.catch((error: Error) => expect(error.message).not.toContain("canary"));
  });
});
