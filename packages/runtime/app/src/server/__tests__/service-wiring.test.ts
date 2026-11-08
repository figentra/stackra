/**
 * Stackra file contract:
 * Purpose: the wiring a service gets by default for its outgoing calls, booted through `createApp` from the real package
 *          entries gen's wiring imports (`systemDriverDefaults`): `ClientSession` takes `service` (`@stackra/app/server`) over `ServiceTokens`
 *          (`@stackra/identity/contracts`) and `ClientsConfig` (`@stackra/clients`), and `ServiceTokens` takes `zitadel`
 *          (`@stackra/identity/node`) over `ServiceTokensConfig` (`@stackra/identity/node`), the secret store and the
 *          clock. A generated client's call then sends the token the issuer gave for the producer's project; a producer
 *          module with no `clients.audiences` entry fails closed with a `TypeError` naming it, before any token is asked
 *          for and before anything is sent.
 * Boundary: test only; the key pair is generated here and thrown away, `fetch` stands in for the issuer and the producer.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0209 (decision 3 and its 2026-11-07 amendment); ADR 0263 (gen writes the wiring);
 *                     STA-2558.
 */
import { generateKeyPairSync } from "node:crypto";

import { ClientsConfig, HttpClientTransportDriver } from "@stackra/clients";
import { ClientSession } from "@stackra/clients/contracts";
import { MemorySecretStoreDriver } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Module } from "@stackra/container";
import type { Wiring } from "@stackra/container";
import { Clock, HttpMethod } from "@stackra/contracts";
import { ServiceTokens } from "@stackra/identity/contracts";
import { ServiceTokensConfig, ZitadelServiceTokensDriver } from "@stackra/identity/node";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { z } from "zod";

import { ServiceClientSessionDriver } from "#server/drivers/service-client-session.driver";
import { createApp } from "#server/functions/create-app.function";

const ISSUER = "https://id.example.test";
const PAY_PROJECT = "312909075212460003";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

/** The host's issuer and its audiences, as runway's config layers set them. */
class HostServiceTokensConfig extends ServiceTokensConfig {
  override issuer = ISSUER;
}

/** Pay's base URL and project. */
class HostClientsConfig extends ClientsConfig {
  override producers = { pay: "https://pay.internal" };

  override audiences = { pay: PAY_PROJECT };
}

/** The secret store holding a throwaway service account key under the configured name. */
class TestSecrets extends MemorySecretStoreDriver {
  constructor() {
    super();
    this.set(
      "IDENTITY_SERVICE_ACCOUNT_KEY",
      JSON.stringify({
        keyId: "312909075212460002",
        key: privateKey,
        userId: "312909075212460001",
      }),
    );
  }
}

class ShipModule extends Module({}) {}

/** The wiring gen writes for a service that declares @stackra/app, @stackra/clients and @stackra/identity. */
const wiring: Wiring = {
  member: "shipping",
  root: ShipModule,
  modules: { shipping: { exports: [], dependsOn: [], type: ShipModule } },
  config: [
    { key: "clients", provide: ClientsConfig, override: HostClientsConfig },
    {
      key: "identity.service_tokens",
      provide: ServiceTokensConfig,
      override: HostServiceTokensConfig,
    },
  ],
  drivers: [
    {
      port: ClientSession,
      key: "clients.ClientSession",
      default: "service",
      candidates: {
        // the wiring imports `@stackra/app/server`, whose barrel exports this class (index.test.ts)
        service: () =>
          import("#server/drivers/service-client-session.driver").then(
            (m) => m.ServiceClientSessionDriver,
          ),
      },
      deps: { service: [ServiceTokens, ClientsConfig] },
    },
    {
      port: ServiceTokens,
      key: "identity.ServiceTokens",
      default: "zitadel",
      candidates: {
        zitadel: () => import("@stackra/identity/node").then((m) => m.ZitadelServiceTokensDriver),
      },
      deps: { zitadel: [ServiceTokensConfig, SecretStore, Clock] },
    },
    {
      port: SecretStore,
      key: "config.SecretStore",
      candidates: { memory: async () => TestSecrets },
    },
  ],
};

/** Stubs `fetch` as the issuer's token endpoint and Pay, and returns what each saw. */
function network(): { tokenRequests: number; sent: Request[] } {
  const seen = { tokenRequests: 0, sent: [] as Request[] };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | Request) => {
      if (typeof input === "string" && input === `${ISSUER}/oauth/v2/token`) {
        seen.tokenRequests += 1;
        return Response.json({ access_token: "throwaway-pay-token", expires_in: 3600 });
      }
      seen.sent.push(input as Request);
      return Response.json({ posted: true });
    }),
  );
  return seen;
}

/** A generated client's call to `key`, through the booted host's session. */
async function callAs(key: string) {
  const app = await createApp(ShipModule, { wiring });
  try {
    return await app.handlers.run(async (container) => {
      const session = container.get(ClientSession);
      expect(session).toBeInstanceOf(ServiceClientSessionDriver);
      expect(container.get(ServiceTokens)).toBeInstanceOf(ZitadelServiceTokensDriver);
      const transport = new HttpClientTransportDriver(container.get(ClientsConfig), session);
      return transport.send({
        key,
        kind: "action",
        endpoint: { method: HttpMethod.Post, path: "/ledger/posts" },
        input: {},
        output: z.object({ posted: z.boolean() }),
      });
    });
  } finally {
    await app.close();
  }
}

describe("a service's default outgoing-call wiring", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the token ZITADEL gave for the producer's project", async () => {
    const seen = network();
    expect(await callAs("pay.ledger.post@1")).toEqual({ posted: true });
    expect(seen.tokenRequests).toBe(1);
    expect(seen.sent[0]?.headers.get("Authorization")).toBe("Bearer throwaway-pay-token");
  });

  it("fails closed for a producer module with no audience: no token asked for, nothing sent", async () => {
    const seen = network();
    await expect(callAs("ship.parcel.book@1")).rejects.toThrow(
      /no audience is configured for module ship \(clients\.audiences\)/,
    );
    expect(seen.tokenRequests).toBe(0);
    expect(seen.sent).toHaveLength(0);
  });
});
