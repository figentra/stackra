/**
 * Stackra file contract:
 * Purpose: unit tests of `AwsSecretsManagerSecretStoreDriver`: it is the `SecretStore` port; `load` reads the ids in
 *          batches of twenty in the configured region, a JSON-object secret gives one secret per string member and a
 *          plain one a secret under its name; a `get` before the load throws; a missing region or id, or an id AWS
 *          refuses, rejects naming ids only.
 * Boundary: test only; the AWS SDK is mocked, so no call leaves the process. Every value is a made-up canary.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { AwsSecretsManagerConfig } from "#config/aws-secrets-manager.config";
import { SecretStore } from "#contracts/ports/secret-store.port";
import { buildConfig } from "#core/functions/build-config.function";
import { AwsSecretsManagerSecretStoreDriver } from "#node/drivers/aws-secrets-manager-secret-store.driver";

const aws = vi.hoisted(() => ({
  regions: [] as unknown[],
  batches: [] as string[][],
  errors: [] as { SecretId: string }[],
  destroyed: 0,
}));

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  BatchGetSecretValueCommand: class {
    readonly input: { SecretIdList: string[] };
    constructor(input: { SecretIdList: string[] }) {
      this.input = input;
    }
  },
  SecretsManagerClient: class {
    constructor(options: unknown) {
      aws.regions.push(options);
    }
    async send(command: { input: { SecretIdList: string[] } }) {
      aws.batches.push(command.input.SecretIdList);
      return {
        SecretValues: command.input.SecretIdList.map((id) => ({
          Name: id,
          SecretString:
            id === "app/json"
              ? JSON.stringify({ RESEND_API_KEY: "json-canary", COUNT: 3 })
              : `${id}-canary`,
        })),
        Errors: aws.errors,
      };
    }
    destroy() {
      aws.destroyed += 1;
    }
  },
}));

function store(values: Record<string, unknown>): AwsSecretsManagerSecretStoreDriver {
  return new AwsSecretsManagerSecretStoreDriver(buildConfig(AwsSecretsManagerConfig, { values }));
}

describe(AwsSecretsManagerSecretStoreDriver, () => {
  it("is a SecretStore that throws before it is loaded", () => {
    const driver = store({});
    expect(driver).toBeInstanceOf(SecretStore);
    expect(() => driver.get("X")).toThrow(/not loaded/);
  });

  it("reads the ids in batches of twenty and splits JSON secrets", async () => {
    const ids = ["app/json", ...Array.from({ length: 20 }, (_, n) => `plain/${n}`)];
    const driver = store({ region: "me-central-1", secretIds: ids });
    await driver.load();
    expect(aws.regions.at(-1)).toEqual({ region: "me-central-1" });
    expect(aws.batches.map((batch) => batch.length)).toEqual([20, 1]);
    expect(driver.get("RESEND_API_KEY")).toBe("json-canary");
    expect(driver.get("COUNT")).toBeUndefined();
    expect(driver.get("plain/19")).toBe("plain/19-canary");
    expect(aws.destroyed).toBe(1);
  });

  it("refuses a missing region or id, and names refused ids only", async () => {
    await expect(store({ secretIds: ["a"] }).load()).rejects.toThrow(/needs a region/);
    await expect(store({ region: "me-central-1" }).load()).rejects.toThrow(/at least one/);
    aws.errors = [{ SecretId: "app/missing" }];
    const failed = store({ region: "me-central-1", secretIds: ["app/missing"] }).load();
    await expect(failed).rejects.toThrow("AWS Secrets Manager could not read: app/missing");
    await failed.catch((error: Error) => expect(error.message).not.toContain("canary"));
  });
});
