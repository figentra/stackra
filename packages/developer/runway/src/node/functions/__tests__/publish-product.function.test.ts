/**
 * Stackra file contract:
 * Purpose: unit tests of `publishProduct` (with `readBundles`, `uploadBundle` and `bundleSurfaces`): a publish
 *          uploads every bundle file under `<product>/<surface>/<version>/` with immutable headers, then writes the
 *          platform rows and the `canary:` row with the scopes and start; a first release writes `release:` instead;
 *          an unserved target, a missing bundle, two bundle versions, missing canary scopes and a missing ops review
 *          are refused before any upload or write.
 * Boundary: test only; runs in a temporary folder with a fake command runner and an in-memory KV writer, so nothing
 *           reaches wrangler, R2 or Workers KV.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decisions 4 and 10); app-shells 4.2, 5.3, 15 (point 7)
 *                     and 16 (points 4 and 7); owner decision D6.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { publishProduct } from "#node/functions/publish-product.function";
import { MemoryEdgeKv } from "#node/functions/__tests__/fixtures/memory-edge-kv.fixture";
import { PRODUCT_ROOT, writeBundle } from "#node/functions/__tests__/fixtures/product-root.fixture";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { ProductPublishRequest } from "#node/types/product-publish-request.type";

const NOW = new Date("2026-10-28T00:00:00.000Z");
const BASE = "https://assets.test/mezzora/console/1.3.0/";

let repository: string;
let calls: Parameters<CommandRunner>[];
let kv: MemoryEdgeKv;

const run: CommandRunner = async (command, args, options) => {
  calls.push([command, args, options]);
  return "";
};

/** A request for the temporary repository. */
function request(extra: Partial<ProductPublishRequest> = {}): ProductPublishRequest {
  return {
    repository,
    environment: "production",
    kv,
    assets: { bucket: "figentra-assets", origin: "https://assets.test/" },
    served: ["console@3"],
    canaryScopes: ["scp_internal", "scp_demo"],
    appLinks: { appleTeams: { figentra: "ABCDE12345" }, androidCertificates: { staff: ["AA:BB"] } },
    review: { author: "dana", approvals: ["sam"] },
    now: NOW,
    run,
    ...extra,
  };
}

/** The issue paths `promise` rejects with. */
async function issuePaths(promise: Promise<unknown>): Promise<string[]> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("expected a RunwayInvalidError");
}

beforeEach(() => {
  calls = [];
  kv = new MemoryEdgeKv();
  repository = mkdtempSync(join(tmpdir(), "stackra-publish-"));
  writeFileSync(join(repository, "runway.yaml"), JSON.stringify(PRODUCT_ROOT));
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("publishProduct", () => {
  it("uploads the bundle, writes the platform rows and starts the canary", async () => {
    writeBundle(repository, "console", "1.3.0");
    const result = await publishProduct(request());

    expect(result.uploaded).toEqual([
      "mezzora/console/1.3.0/bundle.manifest.json",
      "mezzora/console/1.3.0/chunks/view-def.js",
      "mezzora/console/1.3.0/entry-abc.js",
      "mezzora/console/1.3.0/style-123.css",
    ]);
    expect(calls[2]).toEqual([
      "wrangler",
      [
        "r2",
        "object",
        "put",
        "figentra-assets/mezzora/console/1.3.0/entry-abc.js",
        `--file=${join(repository, "dist/bundles/console/1.3.0/entry-abc.js")}`,
        "--cache-control=public, max-age=31536000, immutable",
        "--content-type=text/javascript",
        "--remote",
      ],
      {},
    ]);

    const canary = {
      version: "1.3.0",
      url: `${BASE}entry-abc.js`,
      base: BASE,
      targets: "console@3",
      modulepreload: [`${BASE}entry-abc.js`, `${BASE}chunks/view-def.js`],
      css: [`${BASE}style-123.css`],
      scopes: ["scp_internal", "scp_demo"],
      since: NOW.toISOString(),
    };
    expect(result.canaries).toEqual({ console: canary });
    expect(result.releases).toEqual({});
    expect(kv.json("canary:mezzora:console")).toEqual(canary);
    expect(kv.rows.has("release:mezzora:console")).toBe(false);
    expect(result.written).toEqual([
      "host:console.mezzora.figentra.com",
      "host:mezzora.figentra.com",
      "host:mezzora.com",
      "wellknown:console.mezzora.figentra.com:apple-app-site-association",
      "wellknown:console.mezzora.figentra.com:assetlinks.json",
      "canary:mezzora:console",
    ]);
  });

  it("writes the release pointer directly on a first release", async () => {
    writeBundle(repository, "console", "1.3.0");
    const result = await publishProduct(request({ firstRelease: true, canaryScopes: [] }));
    expect(result.canaries).toEqual({});
    expect(kv.json("release:mezzora:console")).toEqual(result.releases["console"]);
    expect(kv.rows.has("canary:mezzora:console")).toBe(false);
  });

  it("refuses an unserved target before any upload or write", async () => {
    writeBundle(repository, "console", "1.3.0", { targets: "console@4" });
    expect(await issuePaths(publishProduct(request()))).toEqual(["surfaces.console"]);
    expect(calls).toEqual([]);
    expect(kv.calls).toEqual([]);
  });

  it("refuses a missing bundle and two bundle versions", async () => {
    expect(await issuePaths(publishProduct(request()))).toEqual(["dist/bundles/console"]);
    writeBundle(repository, "console", "1.3.0");
    writeBundle(repository, "console", "1.4.0");
    expect(await issuePaths(publishProduct(request()))).toEqual(["dist/bundles/console"]);
    expect(kv.calls).toEqual([]);
  });

  it("refuses a manifest whose version is not its folder's", async () => {
    writeBundle(repository, "console", "1.3.0", { version: "1.2.0" });
    expect(await issuePaths(publishProduct(request()))).toEqual([
      "dist/bundles/console/1.3.0/bundle.manifest.json:version",
    ]);
  });

  it("refuses a release with no canary scopes", async () => {
    writeBundle(repository, "console", "1.3.0");
    expect(await issuePaths(publishProduct(request({ canaryScopes: [] })))).toEqual([
      "canaryScopes",
    ]);
    expect(kv.calls).toEqual([]);
  });

  it("refuses an ops contribution without a second reviewer", async () => {
    writeBundle(repository, "console", "1.3.0");
    expect(
      await issuePaths(
        publishProduct(request({ review: { author: "dana", approvals: ["dana"] } })),
      ),
    ).toEqual(["surfaces.ops"]);
    expect(calls).toEqual([]);
    expect(kv.calls).toEqual([]);
  });
});
