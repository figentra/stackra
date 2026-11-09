/**
 * Stackra file contract:
 * Purpose: unit tests of the pull-request path of `publishProduct` (`publishPullRequest`) and of
 *          `pullRequestPreviewHost`: one `<product>-pr-<n>.figentra.cloud` host row and one `release:…:pr-<n>` row, both with a
 *          7-day expiry, no canary, no app-link file; a wrong environment, a bad number, an unserved target and a
 *          missing bundle, a missing product and a host another product holds are refused before any upload or write.
 * Boundary: test only; temporary folder, fake command runner, in-memory KV writer.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0289 (decision 7, the 2026-11-01 note; STA-1907).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { MemoryEdgeKv } from "#node/functions/__tests__/fixtures/memory-edge-kv.fixture";
import { PRODUCT_ROOT, writeBundle } from "#node/functions/__tests__/fixtures/product-root.fixture";
import { publishProduct } from "#node/functions/publish-product.function";
import { pullRequestPreviewHost } from "#node/functions/pull-request-preview-host.function";
import type { ProductPublishRequest } from "#node/types/product-publish-request.type";

const BASE = "https://assets.test/mezzora/console/abc123def456/";
const SEVEN_DAYS = 604_800;

let repository: string;
let uploads: number;
let kv: MemoryEdgeKv;

/** A preview publish of pull request 412. */
function request(extra: Partial<ProductPublishRequest> = {}): ProductPublishRequest {
  return {
    repository,
    environment: "preview",
    pullRequest: 412,
    kv,
    assets: { bucket: "figentra-assets", origin: "https://assets.test/" },
    served: ["console@3"],
    run: async () => {
      uploads += 1;
      return "";
    },
    ...extra,
  };
}

beforeEach(() => {
  uploads = 0;
  kv = new MemoryEdgeKv();
  repository = mkdtempSync(join(tmpdir(), "stackra-pr-preview-"));
  writeFileSync(
    join(repository, "runway.yaml"),
    JSON.stringify({
      ...PRODUCT_ROOT,
      environments: { ...PRODUCT_ROOT.environments, preview: { regions: ["me-central"] } },
    }),
  );
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("pullRequestPreviewHost", () => {
  it("is one label under figentra.cloud, named by the product", () => {
    expect(pullRequestPreviewHost("mezzora", 412)).toBe("mezzora-pr-412.figentra.cloud");
  });

  it("gives two products' pull requests of the same number two hosts", () => {
    expect(pullRequestPreviewHost("pay", 412)).not.toBe(pullRequestPreviewHost("commerce", 412));
  });

  it("refuses a number that is not a pull request's, and a product that is not a DNS label", () => {
    expect(() => pullRequestPreviewHost("mezzora", 0)).toThrow(TypeError);
    expect(() => pullRequestPreviewHost("mezzora", 1.5)).toThrow(TypeError);
    expect(() => pullRequestPreviewHost("Mezzora.app", 412)).toThrow(TypeError);
  });
});

describe("publishProduct for a pull request", () => {
  it("writes the host and release rows with a 7-day expiry and no canary", async () => {
    writeBundle(repository, "console", "abc123def456");
    const result = await publishProduct(request());

    expect(result.host).toBe("mezzora-pr-412.figentra.cloud");
    expect(result.canaries).toEqual({});
    expect(result.written).toEqual([
      "release:mezzora:console:pr-412",
      "host:mezzora-pr-412.figentra.cloud",
    ]);
    expect(kv.json("host:mezzora-pr-412.figentra.cloud")).toEqual({
      product: "mezzora",
      surface: "console",
      region: "me-central",
      status: "active",
      realm: "tenant",
      canonical: "mezzora-pr-412.figentra.cloud",
      pullRequest: 412,
    });
    expect(kv.json("release:mezzora:console:pr-412")).toEqual({
      version: "abc123def456",
      url: `${BASE}entry-abc.js`,
      base: BASE,
      targets: "console@3",
      modulepreload: [`${BASE}entry-abc.js`, `${BASE}chunks/view-def.js`],
      css: [`${BASE}style-123.css`],
    });
    expect(kv.calls.map((call) => call[3])).toEqual([SEVEN_DAYS, SEVEN_DAYS]);
    expect(kv.rows.has("release:mezzora:console")).toBe(false);
  });

  it("refuses another environment, before any upload or write", async () => {
    writeBundle(repository, "console", "abc123def456");
    await expect(publishProduct(request({ environment: "staging" }))).rejects.toBeInstanceOf(
      RunwayInvalidError,
    );
    expect(uploads).toBe(0);
    expect(kv.calls).toEqual([]);
  });

  it("refuses a host another product's preview holds, before any upload or write", async () => {
    writeBundle(repository, "console", "abc123def456");
    kv.rows.set("host:mezzora-pr-412.figentra.cloud", JSON.stringify({ product: "pay" }));
    await expect(publishProduct(request())).rejects.toBeInstanceOf(RunwayInvalidError);
    expect(uploads).toBe(0);
    expect(kv.calls).toEqual([]);
  });

  it("replaces its own product's host row on the next push", async () => {
    writeBundle(repository, "console", "abc123def456");
    kv.rows.set("host:mezzora-pr-412.figentra.cloud", JSON.stringify({ product: "mezzora" }));
    const result = await publishProduct(request());
    expect(result.written).toContain("host:mezzora-pr-412.figentra.cloud");
  });

  it("refuses a runway with no product, before any upload or write", async () => {
    writeBundle(repository, "console", "abc123def456");
    const { product: _product, ...rest } = PRODUCT_ROOT as typeof PRODUCT_ROOT & {
      product?: unknown;
    };
    writeFileSync(
      join(repository, "runway.yaml"),
      JSON.stringify({
        ...rest,
        environments: { ...PRODUCT_ROOT.environments, preview: { regions: ["me-central"] } },
      }),
    );
    await expect(publishProduct(request())).rejects.toBeInstanceOf(RunwayInvalidError);
    expect(uploads).toBe(0);
    expect(kv.calls).toEqual([]);
  });

  it("refuses an unserved target and a missing bundle", async () => {
    writeBundle(repository, "console", "abc123def456");
    await expect(publishProduct(request({ served: ["console@4"] }))).rejects.toBeInstanceOf(
      RunwayInvalidError,
    );
    rmSync(join(repository, "dist"), { recursive: true });
    await expect(publishProduct(request())).rejects.toBeInstanceOf(RunwayInvalidError);
    expect(uploads).toBe(0);
    expect(kv.calls).toEqual([]);
  });
});
