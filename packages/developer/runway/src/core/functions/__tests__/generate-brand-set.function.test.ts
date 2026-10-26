/**
 * Stackra file contract:
 * Purpose: unit tests of `generateBrandSet`: the generator receives the root runway's request and its record is
 *          answered; a generator failure reaches the caller unchanged.
 * Boundary: test only; the generator is a fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { PRODUCT_ROOT } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { generateBrandSet } from "#core/functions/generate-brand-set.function";
import { BrandGenerator } from "#core/ports/brand-generator.port";
import type { BrandGenerateRecord } from "#core/types/brand-generate-record.type";
import type { BrandGenerateRequest } from "#core/types/brand-generate-request.type";

/** Records each request and answers a fixed record, or fails. */
class FakeBrandGenerator extends BrandGenerator {
  readonly requests: BrandGenerateRequest[] = [];

  constructor(private readonly failure?: Error) {
    super();
  }

  override async generate(request: BrandGenerateRequest): Promise<BrandGenerateRecord> {
    this.requests.push(request);
    if (this.failure !== undefined) throw this.failure;
    return { kit: "mezzora", out: request.out, files: ["heroui/web.css"] };
  }
}

describe("generateBrandSet", () => {
  it("runs the root runway's request", async () => {
    const generator = new FakeBrandGenerator();
    await expect(generateBrandSet(PRODUCT_ROOT, generator)).resolves.toEqual({
      kit: "mezzora",
      out: ".stackra/brand",
      files: ["heroui/web.css"],
    });
    expect(generator.requests).toEqual([
      { kit: "assets/brand", store: "assets/store", out: ".stackra/brand" },
    ]);
  });

  it("rethrows the generator's failure", async () => {
    const failure = new Error("kit.json: no symbol");
    await expect(generateBrandSet(PRODUCT_ROOT, new FakeBrandGenerator(failure))).rejects.toBe(
      failure,
    );
  });
});
