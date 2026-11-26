/**
 * Stackra file contract:
 * Purpose: unit tests of `unboundPorts` (`port_unbound`): a service class that injects a port no driver binds is
 *          refused; the same port bound by the member's own driver, a declared package's driver table, a `@Replaces`
 *          row, a gen-reached port (pipeline, system default), a platform binding or the container's `Clock` is not;
 *          a named instance, an unflagged class, an undeclared package's port and a package member are never judged.
 * Boundary: test only; runs on the commerce IR fixture with one class and one dependency added per case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0263 (a wiring mistake fails at boot); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { unboundPorts } from "#core/functions/unbound-ports.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** The port `Metrics` of `@stackra/metrics`, as the reader flags it. */
const METRICS: TokenRef = { class: { name: "Metrics", from: "@stackra/metrics" }, port: true };

/** A declared package whose manifest lists `drivers`. */
const METRICS_PACKAGE = (drivers: readonly Record<string, unknown>[]): MemberIR["dependencies"] => [
  {
    package: "@stackra/metrics",
    manifest: {
      member: "metrics",
      package: "@stackra/metrics",
      version: "0.1.0",
      drivers,
    } as unknown as MemberIR["dependencies"][number]["manifest"],
  },
];

/** A port of `@stackra/actions/contracts` named `name`, flagged as the reader flags one. */
const reached = (name: string): TokenRef => ({
  class: { name, from: "@stackra/actions/contracts" },
  port: true,
});

/** A class of the `orders` module named `name` of `kind`, with `extra` over it. */
function declared(name: string, kind: string, extra: Partial<DeclaredClass> = {}): DeclaredClass {
  return {
    name,
    kind,
    module: "orders",
    file: `src/modules/orders/${kind}s/${name}.ts`,
    importPath: `#modules/orders/${kind}s/${name}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...extra,
  };
}

/** The codes and subjects of the commerce fixture with `added` and the other overrides. */
function findings(
  added: readonly DeclaredClass[],
  over: Partial<MemberIR> = {},
  deps: readonly TokenRef[] = [METRICS],
): string[][] {
  return unboundPorts({
    ...COMMERCE_IR,
    dependencies: METRICS_PACKAGE([]),
    ...over,
    classes: [...COMMERCE_IR.classes, declared("ReportService", "service", { deps }), ...added],
  }).map((error) => [error.code, error.subject]);
}

describe("unboundPorts", () => {
  it("reports nothing on a clean service", () => {
    expect(unboundPorts(COMMERCE_IR)).toEqual([]);
  });

  it("refuses a port no driver binds, naming the class and the port", () => {
    expect(findings([])).toEqual([["port_unbound", "ReportService"]]);
    const [error] = unboundPorts({
      ...COMMERCE_IR,
      dependencies: METRICS_PACKAGE([]),
      classes: [...COMMERCE_IR.classes, declared("ReportService", "service", { deps: [METRICS] })],
    });
    expect(error?.message).toContain("Metrics");
    expect(error?.fix).toContain("Driver(Metrics)");
  });

  it("passes a port the member's own driver binds", () => {
    const driver = declared("MemoryMetricsDriver", "driver", {
      partner: { name: "Metrics", from: "@stackra/metrics" },
    });
    expect(findings([driver])).toEqual([]);
  });

  it("passes a port a declared package's driver table lists", () => {
    const drivers = [{ port: "Metrics", key: "metrics.Metrics", candidates: ["memory"] }];
    expect(findings([], { dependencies: METRICS_PACKAGE(drivers) })).toEqual([]);
  });

  it("passes a replaced port, a pipeline port, a system default, a platform binding and Clock", () => {
    const replacer = declared("OwnMetrics", "service", {
      facets: [
        {
          name: "Replaces",
          target: "class",
          options: { $class: "Metrics", from: "@stackra/metrics" },
        } as DeclaredClass["facets"][number],
      ],
    });
    expect(findings([replacer])).toEqual([]);
    expect(findings([], {}, [reached("EventOutbox"), reached("SystemSettings")])).toEqual([]);
    expect(findings([], {}, [reached("Clock")])).toEqual([]);
  });

  it("never judges a named instance, an unflagged class, an undeclared package or a package member", () => {
    expect(findings([], {}, [{ ...METRICS, named: "primary" }])).toEqual([]);
    expect(findings([], {}, [{ class: METRICS.class }])).toEqual([]);
    expect(findings([], { dependencies: [] })).toEqual([]);
    expect(findings([], { layout: "package" })).toEqual([]);
  });
});
