/**
 * Stackra file contract:
 * Purpose: unit tests of `AwsSdkKmsClientDriver`: it is the `KmsClient` port; the SDK's `KMS` is built once, on first
 *          use, in the configured region (none when empty), and each call goes to it as given; `KmsSignerDriver`
 *          signs through it.
 * Boundary: test only; `@aws-sdk/client-kms` is mocked, so nothing reaches AWS.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0416.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SignerConfig } from "#config/signer.config";
import { KmsClient } from "#contracts/ports/kms-client.port";
import { KmsSignerDriver } from "#core/drivers/kms-signer.driver";
import { buildConfig } from "#core/functions/build-config.function";
import { AwsSdkKmsClientDriver } from "#node/drivers/aws-sdk-kms-client.driver";

const aws = vi.hoisted(() => ({
  options: [] as unknown[],
  calls: [] as { readonly method: string; readonly input: unknown }[],
}));

vi.mock("@aws-sdk/client-kms", () => ({
  KMS: class {
    constructor(options: unknown) {
      aws.options.push(options);
    }

    async sign(input: unknown) {
      aws.calls.push({ method: "sign", input });
      return { Signature: new Uint8Array([1]) };
    }

    async getPublicKey(input: unknown) {
      aws.calls.push({ method: "getPublicKey", input });
      return { PublicKey: new Uint8Array([2]) };
    }

    async decrypt(input: unknown) {
      aws.calls.push({ method: "decrypt", input });
      return { Plaintext: new Uint8Array([3]) };
    }

    async generateDataKeyWithoutPlaintext(input: unknown) {
      aws.calls.push({ method: "generateDataKeyWithoutPlaintext", input });
      return { CiphertextBlob: new Uint8Array([4]) };
    }
  },
}));

describe("AwsSdkKmsClientDriver", () => {
  it("builds the SDK client once, on first use, in the configured region", async () => {
    aws.options.length = 0;
    aws.calls.length = 0;
    const kms = new AwsSdkKmsClientDriver(
      buildConfig(SignerConfig, { values: { region: "me-central-1" } }),
    );
    expect(kms).toBeInstanceOf(KmsClient);
    expect(aws.options).toEqual([]);
    await kms.getPublicKey({ KeyId: "alias/usage-signing" });
    await kms.decrypt({ CiphertextBlob: new Uint8Array([9]), KeyId: "alias/data" });
    expect(aws.options).toEqual([{ region: "me-central-1" }]);
    expect(aws.calls).toEqual([
      { method: "getPublicKey", input: { KeyId: "alias/usage-signing" } },
      { method: "decrypt", input: { CiphertextBlob: new Uint8Array([9]), KeyId: "alias/data" } },
    ]);
  });

  it("leaves the region to the SDK when none is configured", async () => {
    aws.options.length = 0;
    const kms = new AwsSdkKmsClientDriver(buildConfig(SignerConfig, { values: {} }));
    await kms.generateDataKeyWithoutPlaintext({ KeyId: "alias/data", KeySpec: "AES_256" });
    expect(aws.options).toEqual([{}]);
  });

  it("is the client KmsSignerDriver signs through", async () => {
    aws.calls.length = 0;
    const config = buildConfig(SignerConfig, { values: { kmsKeyId: "alias/usage-signing" } });
    const signer = new KmsSignerDriver(config, new AwsSdkKmsClientDriver(config));
    // The mock's one-byte answer is no real signature; what matters is that KMS was asked with the digest.
    await signer.sign(new TextEncoder().encode("report")).catch(() => undefined);
    expect(aws.calls[0]).toMatchObject({
      method: "sign",
      input: { KeyId: "alias/usage-signing", MessageType: "DIGEST" },
    });
  });
});
