/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `AwsSdkKmsClientDriver` and
 *          `AwsSecretsManagerSecretStoreDriver` are its only values, and loading it never loads an AWS SDK: both are
 *          optional peers a host without those stores never installs (BILLING-A, 0.32.0).
 * Boundary: test only; imports the stand-in barrel through its `#node` alias, with each AWS SDK mocked to throw on
 *           import, so an eager import fails this file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as node from "#node/index";

// An SDK the entry imported eagerly would throw here, while `#node/index` above loads.
vi.mock("@aws-sdk/client-secrets-manager", () => {
  throw new Error("@aws-sdk/client-secrets-manager is not installed");
});
vi.mock("@aws-sdk/client-kms", () => {
  throw new Error("@aws-sdk/client-kms is not installed");
});

describe("@stackra/config/node", () => {
  it("exports exactly its values, and loads with neither AWS SDK installed", () => {
    expect(Object.keys(node).toSorted()).toEqual([
      "AwsSdkKmsClientDriver",
      "AwsSecretsManagerSecretStoreDriver",
    ]);
  });
});
