/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRunwayConfig`: a service's runway `config` values become `#stackra/runway-config`, every
 *          environment fixed at build time and in name order; a service without any, a package and an app get none.
 * Boundary: test only; runs on the commerce IR fixture with hand-set runway values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1); STA-2798.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitRunwayConfig } from "#core/functions/emit-runway-config.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The commerce service with durable action stores in staging and production. */
const IR: MemberIR = {
  ...COMMERCE_IR,
  runwayConfig: {
    production: { "actions.stores": { idempotency: "postgres", rateLimit: "postgres" } },
    staging: {
      "actions.stores": { idempotency: "valkey", rateLimit: "valkey" },
      http: { maxBodyBytes: 2048 },
    },
  },
};

describe(emitRunwayConfig, () => {
  it("fixes every environment's values by config key, in name order", () => {
    const content = emitRunwayConfig(IR) ?? "";
    expect(content).toContain(
      "export const runwayConfig: Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, unknown>>>>>> = {",
    );
    const production = content.indexOf(
      '  "production": {"actions.stores":{"idempotency":"postgres","rateLimit":"postgres"}},',
    );
    const staging = content.indexOf(
      '  "staging": {"actions.stores":{"idempotency":"valkey","rateLimit":"valkey"},"http":{"maxBodyBytes":2048}},',
    );
    expect(production).toBeGreaterThan(0);
    expect(staging).toBeGreaterThan(production);
  });

  it("writes nothing without runway values, or for a package or an app", () => {
    expect(emitRunwayConfig(COMMERCE_IR)).toBeUndefined();
    expect(emitRunwayConfig({ ...IR, layout: "package" })).toBeUndefined();
    expect(emitRunwayConfig({ ...IR, layout: "app" })).toBeUndefined();
  });
});
