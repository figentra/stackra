/**
 * Stackra file contract:
 * Purpose: unit tests of `publishExtensionBundles`: one bundle per surface with packages, in surface order, each
 *          targeting its shell line; the ops contribution is held until approved and then published declarations
 *          only; surfaces without a product and a packaged surface without a shell line are refused before any
 *          publish.
 * Boundary: test only; the publisher is a fake that records each bundle.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decisions 4 and 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { PRODUCT_ROOT } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { parseRunway } from "#core/functions/parse-runway.function";
import { publishExtensionBundles } from "#core/functions/publish-extension-bundles.function";
import { ExtensionBundlePublisher } from "#core/ports/extension-bundle-publisher.port";
import type { ExtensionBundle } from "#core/types/extension-bundle.type";
import type { PublishedBundle } from "#core/types/published-bundle.type";

const SHA = "b".repeat(40);

/** A publisher that records every bundle. */
class FakePublisher extends ExtensionBundlePublisher {
  readonly bundles: ExtensionBundle[] = [];

  override async publish(bundle: ExtensionBundle): Promise<PublishedBundle> {
    this.bundles.push(bundle);
    return {
      product: bundle.product,
      surface: bundle.surface,
      version: "1.0.0",
      url: `https://assets.example.com/${bundle.surface}.js`,
    };
  }
}

describe("publishExtensionBundles", () => {
  it("publishes each packaged surface in order and holds ops for its reviewer", async () => {
    const publisher = new FakePublisher();

    const result = await publishExtensionBundles(PRODUCT_ROOT, SHA, publisher, {
      opsApproved: false,
    });

    expect(publisher.bundles).toEqual([
      {
        product: "mezzora",
        surface: "console",
        targets: "os/console@3",
        packages: ["@mezzora/console-ui"],
        sha: SHA,
        declarationsOnly: false,
      },
      {
        product: "mezzora",
        surface: "till",
        targets: "commerce/till@1",
        packages: ["@mezzora/till-ui"],
        sha: SHA,
        declarationsOnly: false,
      },
    ]);
    expect(result.published.map((bundle) => bundle.surface)).toEqual(["console", "till"]);
    expect(result.held).toEqual([
      {
        product: "mezzora",
        surface: "ops",
        packages: ["@mezzora/ops-ui"],
        sha: SHA,
        declarationsOnly: true,
      },
    ]);
  });

  it("publishes the ops contribution once approved", async () => {
    const publisher = new FakePublisher();

    const result = await publishExtensionBundles(PRODUCT_ROOT, SHA, publisher, {
      opsApproved: true,
    });

    expect(result.held).toEqual([]);
    expect(publisher.bundles.map((bundle) => bundle.surface)).toEqual(["console", "ops", "till"]);
  });

  it("refuses surfaces without a product and a packaged surface without a shell line", async () => {
    const publisher = new FakePublisher();
    const base = { version: 3, project: "mezzora", environments: {} };
    const noProduct = parseRunway("root", {
      ...base,
      surfaces: { console: { shell: "os/console@3", packages: ["@a/ui"] } },
    });
    const noShell = parseRunway("root", {
      ...base,
      product: { key: "mezzora" },
      surfaces: { console: { packages: ["@a/ui"] } },
    });

    await expect(
      publishExtensionBundles(noProduct, SHA, publisher, { opsApproved: false }),
    ).rejects.toBeInstanceOf(RunwayUnresolvedError);
    await expect(
      publishExtensionBundles(noShell, SHA, publisher, { opsApproved: false }),
    ).rejects.toBeInstanceOf(RunwayInvalidError);
    expect(publisher.bundles).toEqual([]);
  });
});
