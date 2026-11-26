/**
 * Stackra file contract:
 * Purpose: unit tests of `replicaReadsPorts`: a service with a `reads: "replica"` query reaches `ReplicaReads`, and its
 *          wiring then writes the port's driver table from `@stackra/database`'s manifest with the `DatabaseConfig`
 *          row; a hosted package whose manifest records a `reads: "replica"` query reaches it too, and `buildManifest`
 *          records `reads` and `maxLag`; a service that declares `@stackra/database` and has any query reaches it (so
 *          configuration can place a query on a replica); a service without either, and a package, reach nothing.
 * Boundary: test only; runs on the commerce IR fixture with a hand-built database manifest.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0057 (decision 6); STA-1504; STA-1464.
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitWiring } from "#core/functions/emit-wiring.function";
import { replicaReadsPorts } from "#core/functions/replica-reads-ports.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import type { MemberIR } from "#core/types/member-ir.type";

/** The fixture with its queries reading a replica. */
const REPLICA: MemberIR = {
  ...COMMERCE_IR,
  classes: COMMERCE_IR.classes.map((declared) =>
    declared.kind === "query"
      ? { ...declared, options: { ...declared.options, reads: "replica" } }
      : declared,
  ),
};

/** `@stackra/database` with its `ReplicaReads` driver and config class recorded. */
const DATABASE: MemberIR["dependencies"][number] = {
  package: "@stackra/database",
  manifest: {
    member: "database",
    package: "@stackra/database",
    version: "0.1.0",
    drivers: [
      {
        port: "ReplicaReads",
        key: "actions.ReplicaReads",
        candidates: ["database"],
        classes: {
          database: {
            class: "DatabaseReplicaReadsDriver",
            from: "@stackra/database/node",
            deps: [{ class: { name: "DatabaseConfig", from: "@stackra/database" } }],
          },
        },
      },
    ],
  } as never,
};

describe("replicaReadsPorts", () => {
  it("reaches ReplicaReads for a service with a replica query", () => {
    expect(replicaReadsPorts(REPLICA)).toEqual([
      { class: { name: "ReplicaReads", from: "@stackra/actions/contracts" } },
    ]);
  });

  it("reaches ReplicaReads for a hosted package's replica query, from its manifest", () => {
    const hosted: MemberIR["dependencies"][number] = {
      package: "@stackra/loyalty-kit",
      manifest: {
        member: "loyalty_kit",
        package: "@stackra/loyalty-kit",
        version: "0.1.0",
        actions: buildManifest({ ...REPLICA, layout: "package" }).manifest.actions,
      } as never,
    };
    expect(hosted.manifest.actions?.some((action) => action["reads"] === "replica")).toBe(true);
    expect(replicaReadsPorts({ ...COMMERCE_IR, dependencies: [hosted] })).toEqual([
      { class: { name: "ReplicaReads", from: "@stackra/actions/contracts" } },
    ]);
  });

  it("reaches nothing without a replica query, or in a package", () => {
    expect(replicaReadsPorts(COMMERCE_IR)).toEqual([]);
    expect(replicaReadsPorts({ ...REPLICA, layout: "package" })).toEqual([]);
  });

  it("reaches ReplicaReads for a service that declares the database and has a query, for configuration (STA-1464)", () => {
    expect(replicaReadsPorts({ ...COMMERCE_IR, dependencies: [DATABASE] })).toEqual([
      { class: { name: "ReplicaReads", from: "@stackra/actions/contracts" } },
    ]);
    const noQuery: MemberIR = {
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.filter((declared) => declared.kind !== "query"),
      dependencies: [DATABASE],
    };
    expect(replicaReadsPorts(noQuery)).toEqual([]);
    expect(
      replicaReadsPorts({ ...COMMERCE_IR, dependencies: [DATABASE], layout: "package" }),
    ).toEqual([]);
  });

  it("records a query's maxLag in the manifest (STA-1464)", () => {
    const lagging: MemberIR = {
      ...REPLICA,
      classes: REPLICA.classes.map((declared) =>
        declared.kind === "query"
          ? { ...declared, options: { ...declared.options, maxLag: "2s" } }
          : declared,
      ),
    };
    const queries = (buildManifest(lagging).manifest.actions ?? []).filter(
      (action) => action.kind === "query",
    );
    expect(queries.length).toBeGreaterThan(0);
    for (const query of queries) expect(query).toMatchObject({ reads: "replica", maxLag: "2s" });
  });

  it("makes the service wiring write the database's ReplicaReads table", () => {
    const content = emitWiring({ ...REPLICA, dependencies: [DATABASE] });
    for (const line of [
      "      port: ReplicaReads,",
      '      key: "actions.ReplicaReads",',
      '        "database": () => import("@stackra/database/node").then((m) => m.DatabaseReplicaReadsDriver),',
      '      deps: { "database": [DatabaseConfig] },',
    ])
      expect(content).toContain(line);
    const withoutQueries: MemberIR = {
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.filter((declared) => declared.kind !== "query"),
      dependencies: [DATABASE],
    };
    expect(emitWiring(withoutQueries)).not.toContain("ReplicaReads");
  });
});
