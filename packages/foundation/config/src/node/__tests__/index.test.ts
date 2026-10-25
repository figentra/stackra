/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `AwsSecretsManagerSecretStoreDriver` is its only value.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias, with the AWS SDK mocked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as node from "#node/index";

vi.mock("@aws-sdk/client-secrets-manager", () => ({
  BatchGetSecretValueCommand: class {},
  SecretsManagerClient: class {},
}));

describe("@stackra/config/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual(["AwsSecretsManagerSecretStoreDriver"]);
  });
});
