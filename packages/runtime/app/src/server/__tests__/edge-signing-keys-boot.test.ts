/**
 * Stackra file contract:
 * Purpose: what the `secrets` edge signing-keys driver reads once an app is booted, through the shipped boot paths. The
 *          server target's `createApp` binds the process environment it started with as the `SecretStore`, never the
 *          wiring's own `SecretStore` driver, so a key rotated in that driver's store is refused by `EdgeHeaderGuard`
 *          and only the boot environment's key is accepted: a rotation still needs a restart (STA-2804 makes the bound
 *          store reload). A direct `bootApp` caller that overrides `SecretStore` with a store it reloads gets the
 *          rotation on the next check, with no reboot: the new key is accepted and a retired one refused.
 * Boundary: test only; real containers over a small wiring (the edge config and the two ports gen binds), the signing
 *           keys are test strings, never secrets, and requests are built as the edge Worker forwards them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0437 (decision 4: two signing keys, rotated without a cut-over); ADR 0295
 *                     (decisions 7, 8 and 10); ADR 0173.
 */
import { createHash } from "node:crypto";

import { SecretStore } from "@stackra/config/contracts";
import { Module } from "@stackra/container";
import type { Wiring } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { EdgeConfig } from "#config/edge.config";
import { EdgeHeader } from "#contracts/enums/edge-header.enum";
import { EdgeSigningKeys } from "#contracts/ports/edge-signing-keys.port";
import { bootApp } from "#core/functions/boot-app.function";
import { signEdgeRequest } from "#core/functions/sign-edge-request.function";
import { EdgeOptions } from "#core/schemas/edge-options.schema";
import { MemoryEdgeNonceStoreDriver } from "#server/drivers/memory-edge-nonce-store.driver";
import { SecretsEdgeSigningKeysDriver } from "#server/drivers/secrets-edge-signing-keys.driver";
import { EdgeSignatureInvalidError } from "#server/errors/edge-signature-invalid.error";
import { createApp } from "#server/functions/create-app.function";
import { EdgeHeaderGuard } from "#server/services/edge-header.guard";

/** A store whose values change in place, as a store reloaded after a rotation does. */
class RotatingSecretStore extends SecretStore {
  static keys = "rotated";

  get(name: string): string | undefined {
    return name === "STACKRA_EDGE_SIGNING_KEYS" ? RotatingSecretStore.keys : undefined;
  }
}

/** The host's edge config, as runway's `app.edge.keys: secrets` sets it. */
class HostEdgeConfig extends EdgeConfig {
  override keys = "secrets" as const;
}

class ApiModule extends Module({}) {}

/** The wiring gen writes for an API: the edge config, the signing-keys port, and a `SecretStore` driver of its own. */
const wiring: Wiring = {
  member: "api",
  root: ApiModule,
  modules: { api: { exports: [], dependsOn: [], type: ApiModule } },
  config: [{ key: "app.edge", provide: EdgeConfig, override: HostEdgeConfig, schema: EdgeOptions }],
  drivers: [
    {
      port: EdgeSigningKeys,
      key: "app.EdgeSigningKeys",
      selectedBy: "config:app.edge.keys",
      default: "memory",
      candidates: {
        secrets: () =>
          import("#server/drivers/secrets-edge-signing-keys.driver").then(
            (m) => m.SecretsEdgeSigningKeysDriver,
          ),
      },
      deps: { secrets: [SecretStore, EdgeConfig] },
    },
    {
      port: SecretStore,
      key: "config.SecretStore",
      default: "rotating",
      candidates: { rotating: () => Promise.resolve(RotatingSecretStore) },
    },
  ],
};

let next = 0;

/** A request as the edge Worker forwards it, signed with `key`. */
async function forwarded(key: string): Promise<Request> {
  const body = '{"total":10}';
  const input = {
    scope: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
    product: "commerce",
    surface: "console",
    realm: "staff",
    requestId: `req-boot-${(next += 1)}`,
    timestamp: Math.floor(Date.now() / 1000),
    method: "POST",
    path: "/api/orders",
    bodyHash: createHash("sha256").update(body).digest("hex"),
  };
  return new Request(`https://api.example.test${input.path}`, {
    method: "POST",
    headers: {
      [EdgeHeader.Scope]: input.scope,
      [EdgeHeader.Product]: input.product,
      [EdgeHeader.Surface]: input.surface,
      [EdgeHeader.Realm]: input.realm,
      [EdgeHeader.RequestId]: input.requestId,
      [EdgeHeader.Timestamp]: String(input.timestamp),
      [EdgeHeader.Signature]: await signEdgeRequest(input, key),
    },
    body,
  });
}

/** Whether `guard` accepts a request signed with `key`. */
async function accepts(guard: EdgeHeaderGuard, key: string): Promise<boolean> {
  try {
    await guard.check(await forwarded(key));
    return true;
  } catch (error) {
    if (isRefusal(error, EdgeSignatureInvalidError)) return false;
    throw error;
  }
}

describe("the secrets edge signing-keys driver, once booted", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    RotatingSecretStore.keys = "rotated";
  });

  it("reads the boot environment in the server target, never the wiring's SecretStore driver: a rotation needs a restart", async () => {
    vi.stubEnv("STACKRA_EDGE_SIGNING_KEYS", "booted");
    const app = await createApp(ApiModule, { wiring });
    try {
      await app.handlers.run(async (container) => {
        const keys = container.get(EdgeSigningKeys);
        expect(keys).toBeInstanceOf(SecretsEdgeSigningKeysDriver);
        expect(container.get(SecretStore)).not.toBeInstanceOf(RotatingSecretStore);
        const guard = new EdgeHeaderGuard(keys, new MemoryEdgeNonceStoreDriver());
        expect(await accepts(guard, "booted")).toBe(true);
        expect(await accepts(guard, "rotated")).toBe(false);
      });
    } finally {
      await app.close();
    }
  });

  it("follows a SecretStore a bootApp caller binds and reloads, with no reboot", async () => {
    const store = new RotatingSecretStore();
    RotatingSecretStore.keys = "first";
    const { container } = await bootApp(wiring, {
      roots: [ApiModule],
      env: {},
      overrides: new Map([[SecretStore, store]]),
    });
    const guard = new EdgeHeaderGuard(
      container.get(EdgeSigningKeys),
      new MemoryEdgeNonceStoreDriver(),
    );
    expect(await accepts(guard, "first")).toBe(true);
    expect(await accepts(guard, "second")).toBe(false);
    RotatingSecretStore.keys = "second,first";
    expect(await accepts(guard, "second")).toBe(true);
    expect(await accepts(guard, "first")).toBe(true);
    RotatingSecretStore.keys = "second";
    expect(await accepts(guard, "first")).toBe(false);
  });
});
