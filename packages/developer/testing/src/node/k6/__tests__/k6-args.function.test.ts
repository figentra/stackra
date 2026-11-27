/**
 * Stackra file contract:
 * Purpose: unit tests of `k6Args` and `K6_SCENARIO_SCRIPT`: a quiet run with no usage report and the summary exported,
 *          the target (trailing slash dropped), scenario, executor and thresholds passed as `-e` variables, an
 *          arrival-rate executor with its time unit and default `maxVUs`, and a script that posts to the named scenario.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-317.
 */
import { describe, expect, it } from "@stackra/testing";

import { k6Args } from "#node/k6/k6-args.function";
import { K6_SCENARIO_SCRIPT } from "#node/k6/k6-scenario-script.constant";

const FILES = { script: "/tmp/x/run.js", summary: "/tmp/x/summary.json" };

/** The `-e` variables of `args`, by name. */
const envOf = (args: readonly string[]): Record<string, string> =>
  Object.fromEntries(
    args.flatMap((arg, index) => {
      if (args[index - 1] !== "-e") return [];
      const at = arg.indexOf("=");
      return [[arg.slice(0, at), arg.slice(at + 1)]];
    }),
  );

describe("k6Args", () => {
  it("runs the script quietly, with no usage report, exporting the summary", () => {
    const args = k6Args(
      {
        target: "http://127.0.0.1:4100/",
        scenario: "push",
        load: { executor: "constant-vus", vus: 5, duration: "10s" },
      },
      FILES,
    );
    expect(args.slice(0, 6)).toEqual([
      "run",
      "--quiet",
      "--no-usage-report",
      "--no-color",
      "--summary-export",
      "/tmp/x/summary.json",
    ]);
    expect(args.at(-1)).toBe("/tmp/x/run.js");
    expect(envOf(args)).toEqual({
      STACKRA_LOAD_TARGET: "http://127.0.0.1:4100",
      STACKRA_LOAD_NAME: "push",
      STACKRA_LOAD_EXECUTOR: JSON.stringify({ executor: "constant-vus", vus: 5, duration: "10s" }),
      STACKRA_LOAD_THRESHOLDS: "{}",
    });
  });

  it("gives an arrival-rate load a per-second unit and maxVUs, and passes the thresholds", () => {
    const env = envOf(
      k6Args(
        {
          target: "http://127.0.0.1:4100",
          scenario: "relay.write",
          load: {
            executor: "constant-arrival-rate",
            rate: 300,
            duration: "1m",
            preAllocatedVUs: 75,
          },
          thresholds: { http_req_failed: ["rate<0.001"], http_req_duration: ["p(95)<50"] },
        },
        FILES,
      ),
    );
    expect(JSON.parse(env["STACKRA_LOAD_EXECUTOR"] ?? "")).toEqual({
      executor: "constant-arrival-rate",
      rate: 300,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 75,
      maxVUs: 75,
    });
    expect(JSON.parse(env["STACKRA_LOAD_THRESHOLDS"] ?? "")).toEqual({
      http_req_failed: ["rate<0.001"],
      http_req_duration: ["p(95)<50"],
    });
  });
});

describe("K6_SCENARIO_SCRIPT", () => {
  it("posts to the named scenario, checks for a 204 and reads its options from the environment", () => {
    expect(K6_SCENARIO_SCRIPT).toContain("http.post(`${target}/scenarios/${name}`, null)");
    expect(K6_SCENARIO_SCRIPT).toContain("r.status === 204");
    expect(K6_SCENARIO_SCRIPT).toContain("JSON.parse(__ENV.STACKRA_LOAD_EXECUTOR)");
    expect(K6_SCENARIO_SCRIPT).toContain("JSON.parse(__ENV.STACKRA_LOAD_THRESHOLDS)");
    expect(K6_SCENARIO_SCRIPT).toContain('"p(99)"');
  });
});
