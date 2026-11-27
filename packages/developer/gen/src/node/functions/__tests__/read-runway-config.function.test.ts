/**
 * Stackra file contract:
 * Purpose: unit tests of `readRunwayConfig`: the root runway's `defaults.service.config` and the member's own `config`
 *          of each environment merge field by field, the member winning, with YAML types kept; undefined when neither
 *          file sets a value (STA-2798).
 * Boundary: test only; writes small repositories (`pnpm-workspace.yaml`, a root runway, `services/orders/runway.yaml`)
 *           under `<gen>/.cache/runway-config/` (gitignored).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 1 and the 2026-10-24 note); STA-2798.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { readRunwayConfig } from "#node/functions/read-runway-config.function";

/** The gen package root. */
const GEN_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));

/** Counts the folders this process wrote, so tests never share one. */
let written = 0;

/** A repository with `root` and `own` as the root and member runways (none when undefined); returns the member root. */
function repository(root: string | undefined, own: string | undefined): string {
  written += 1;
  const folder = join(GEN_ROOT, ".cache", "runway-config", `${process.pid}-${written}`);
  rmSync(folder, { recursive: true, force: true });
  const member = join(folder, "services", "orders");
  mkdirSync(member, { recursive: true });
  writeFileSync(join(folder, "pnpm-workspace.yaml"), "packages: [services/*]\n");
  if (root !== undefined) writeFileSync(join(folder, "runway.yaml"), root);
  if (own !== undefined) writeFileSync(join(member, "runway.yaml"), own);
  return member;
}

describe(readRunwayConfig, () => {
  it("lays the member's config over the root's service defaults, field by field", () => {
    const member = repository(
      [
        "environments:",
        "  staging:",
        "    defaults:",
        "      service:",
        "        config:",
        "          actions.stores:",
        "            idempotency: postgres",
        "            rateLimit: postgres",
        "  production:",
        "    defaults:",
        "      service:",
        "        config:",
        "          actions.stores: { idempotency: postgres, rateLimit: postgres }",
      ].join("\n"),
      [
        "version: 3",
        "environments:",
        "  production:",
        "    config:",
        "      actions.stores:",
        "        rateLimit: valkey",
        "      http:",
        "        maxBodyBytes: 2048",
        "        strict: true",
      ].join("\n"),
    );
    expect(readRunwayConfig(member)).toEqual({
      staging: { "actions.stores": { idempotency: "postgres", rateLimit: "postgres" } },
      production: {
        "actions.stores": { idempotency: "postgres", rateLimit: "valkey" },
        http: { maxBodyBytes: 2048, strict: true },
      },
    });
  });

  it("is undefined when no environment sets a value, or there is no runway", () => {
    expect(
      readRunwayConfig(repository("environments:\n  dev:\n    defaults: {}\n", "version: 3\n")),
    ).toBeUndefined();
    expect(readRunwayConfig(repository(undefined, undefined))).toBeUndefined();
  });
});
