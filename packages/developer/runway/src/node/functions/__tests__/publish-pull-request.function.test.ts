/**
 * Stackra file contract:
 * Purpose: unit tests of the pull-request path of `publishProduct` (`publishPullRequest`) and of
 *          `pullRequestPreviewHost`: one `<product>-pr-<n>.dev.example` host row and one `release:…:pr-<n>` row, both with a
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

const BASE = "https://assets.test/bistro/console/abc123def456/";
const SEVEN_DAYS = 604_800;

let repository: string;
let uploads: number;
let kv: MemoryEdgeKv;

/** The product's pull-request zone, as its root runway names it. */
const ZONE = "dev.example";

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
      environments: {
        ...PRODUCT_ROOT.environments,
        preview: { regions: ["me-central"], domains: { pullRequestZone: ZONE } },
      },
    }),
  );
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("pullRequestPreviewHost", () => {
  it("is one label under the product's zone, named by the product", () => {
    expect(pullRequestPreviewHost("bistro", 412, ZONE)).toBe("bistro-pr-412.dev.example");
    expect(pullRequestPreviewHost("bistro", 412, "preview.acme.test")).toBe(
      "bistro-pr-412.preview.acme.test",
    );
  });

  it("gives two products' pull requests of the same number two hosts", () => {
    expect(pullRequestPreviewHost("pay", 412, ZONE)).not.toBe(
      pullRequestPreviewHost("commerce", 412, ZONE),
    );
  });

  it("refuses a number that is not a pull request's, and a product that is not a DNS label", () => {
    expect(() => pullRequestPreviewHost("bistro", 0, ZONE)).toThrow(TypeError);
    expect(() => pullRequestPreviewHost("bistro", 1.5, ZONE)).toThrow(TypeError);
    expect(() => pullRequestPreviewHost("Bistro.app", 412, ZONE)).toThrow(TypeError);
  });

  it("refuses a zone that is not a lowercase host name of two labels or more", () => {
    for (const zone of [
      "",
      "example",
      ".example",
      "Preview.Example",
      "a..example",
      "-a.example",
      "a.example.",
    ])
      expect(() => pullRequestPreviewHost("bistro", 412, zone), zone).toThrow(TypeError);
  });
});

describe("publishProduct for a pull request", () => {
  it("writes the host and release rows with a 7-day expiry and no canary", async () => {
    writeBundle(repository, "console", "abc123def456");
    const result = await publishProduct(request());

    expect(result.host).toBe("bistro-pr-412.dev.example");
    expect(result.canaries).toEqual({});
    expect(result.written).toEqual([
      "release:bistro:console:pr-412",
      "host:bistro-pr-412.dev.example",
    ]);
    expect(kv.json("host:bistro-pr-412.dev.example")).toEqual({
      product: "bistro",
      surface: "console",
      region: "me-central",
      status: "active",
      realm: "tenant",
      canonical: "bistro-pr-412.dev.example",
      pullRequest: 412,
    });
    expect(kv.json("release:bistro:console:pr-412")).toEqual({
      version: "abc123def456",
      url: `${BASE}entry-abc.js`,
      base: BASE,
      targets: "console@3",
      modulepreload: [`${BASE}entry-abc.js`, `${BASE}chunks/view-def.js`],
      css: [`${BASE}style-123.css`],
    });
    expect(kv.calls.map((call) => call[3])).toEqual([SEVEN_DAYS, SEVEN_DAYS]);
    expect(kv.rows.has("release:bistro:console")).toBe(false);
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
    kv.rows.set("host:bistro-pr-412.dev.example", JSON.stringify({ product: "pay" }));
    await expect(publishProduct(request())).rejects.toBeInstanceOf(RunwayInvalidError);
    expect(uploads).toBe(0);
    expect(kv.calls).toEqual([]);
  });

  it("replaces its own product's host row on the next push", async () => {
    writeBundle(repository, "console", "abc123def456");
    kv.rows.set("host:bistro-pr-412.dev.example", JSON.stringify({ product: "bistro" }));
    const result = await publishProduct(request());
    expect(result.written).toContain("host:bistro-pr-412.dev.example");
  });

  it("refuses a runway with no pull-request zone, before any upload or write", async () => {
    writeBundle(repository, "console", "abc123def456");
    writeFileSync(
      join(repository, "runway.yaml"),
      JSON.stringify({
        ...PRODUCT_ROOT,
        environments: { ...PRODUCT_ROOT.environments, preview: { regions: ["me-central"] } },
      }),
    );
    const refusal = await publishProduct(request()).catch((error: unknown) => error);
    expect(refusal).toBeInstanceOf(RunwayInvalidError);
    expect((refusal as RunwayInvalidError).issues.map((issue) => issue.path)).toEqual([
      "environments.preview.domains.pullRequestZone",
    ]);
    expect(uploads).toBe(0);
    expect(kv.calls).toEqual([]);
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
        environments: {
          ...PRODUCT_ROOT.environments,
          preview: { regions: ["me-central"], domains: { pullRequestZone: ZONE } },
        },
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
