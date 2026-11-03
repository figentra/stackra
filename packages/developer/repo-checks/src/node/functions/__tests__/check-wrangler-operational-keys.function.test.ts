/**
 * Stackra file contract:
 * Purpose: unit tests of `checkWranglerOperationalKeys` and `isWranglerConfig`: each operational key is a finding,
 *          code facts and comments are not, bad JSONC is one finding, and the baseline files are not checked.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0519 (Enforcement); STA-1989.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkWranglerOperationalKeys } from "#node/functions/check-wrangler-operational-keys.function";
import { isWranglerConfig } from "#node/functions/is-wrangler-config.function";

describe("checkWranglerOperationalKeys", () => {
  it("accepts code facts, and a comment that names an operational key", () => {
    const text = `{ // "workers_dev": false lives in runway.yaml
      "name": "api", "main": "src/index.ts", "d1_databases": [{ "database_id": "x" }], "triggers": { "crons": [] },
    }`;
    expect(checkWranglerOperationalKeys("workers/api/wrangler.jsonc", text)).toEqual([]);
  });

  it("refuses each operational key", () => {
    const text = `{ "name": "api", "workers_dev": false, "observability": { "enabled": true } }`;
    expect(checkWranglerOperationalKeys("workers/api/wrangler.jsonc", text)).toEqual([
      `workers/api/wrangler.jsonc: "workers_dev" is an operational setting; set it in the member's runway.yaml (ADR 0519)`,
      `workers/api/wrangler.jsonc: "observability" is an operational setting; set it in the member's runway.yaml (ADR 0519)`,
    ]);
  });

  it("reports a file that is not JSONC once", () => {
    expect(checkWranglerOperationalKeys("w/wrangler.jsonc", "{")).toHaveLength(1);
  });
});

describe("isWranglerConfig", () => {
  it("checks a wrangler.jsonc but not the baseline", () => {
    expect(isWranglerConfig("workers/api/wrangler.jsonc")).toBe(true);
    expect(isWranglerConfig("workers/static/wrangler.jsonc")).toBe(false);
    expect(isWranglerConfig("workers/api/wrangler.toml")).toBe(false);
  });
});
