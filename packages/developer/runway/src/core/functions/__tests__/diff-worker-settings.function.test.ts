/**
 * Stackra file contract:
 * Purpose: tests of `diffWorkerSettings`.
 * Boundary: test only.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 7); STA-1992.
 */
import { describe, expect, it } from "@stackra/testing";

import { diffWorkerSettings } from "#core/functions/diff-worker-settings.function";

describe("diffWorkerSettings", () => {
  it("compares nested settings and arrays as sets, and ignores code facts and unreported flags", () => {
    const rendered = {
      name: "w",
      compatibility_flags: ["b", "a"],
      keep_vars: true,
      observability: { enabled: true, logs: { enabled: true, invocation_logs: false } },
    };
    const live = {
      name: "other",
      compatibility_flags: ["a", "b"],
      observability: { enabled: true, logs: { enabled: false } },
    };
    expect(diffWorkerSettings(rendered, live)).toEqual([
      { key: "observability.logs.enabled", rendered: "true", live: "false" },
      { key: "observability.logs.invocation_logs", rendered: "false", live: "<unset>" },
    ]);
  });
});
