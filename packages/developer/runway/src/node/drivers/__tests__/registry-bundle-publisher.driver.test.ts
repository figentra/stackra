/**
 * Stackra file contract:
 * Purpose: unit tests of `RegistryBundlePublisherDriver`: with no OS registry client wired, publish rejects with
 *          `RunwayNotConfiguredError` naming the `ExtensionBundlePublisher` port.
 * Boundary: test only; nothing is contacted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayNotConfiguredError } from "#core/errors/runway-not-configured.error";
import { RegistryBundlePublisherDriver } from "#node/drivers/registry-bundle-publisher.driver";

describe("RegistryBundlePublisherDriver", () => {
  it("rejects publish with RunwayNotConfiguredError", async () => {
    const publisher = new RegistryBundlePublisherDriver();
    const bundle = {
      product: "mezzora",
      surface: "console",
      targets: "os/console@3",
      packages: ["@mezzora/console-ui"],
      sha: "f".repeat(40),
      declarationsOnly: false,
    } as const;

    await expect(publisher.publish(bundle)).rejects.toBeInstanceOf(RunwayNotConfiguredError);
    await expect(publisher.publish(bundle)).rejects.toMatchObject({
      port: "ExtensionBundlePublisher",
    });
  });
});
