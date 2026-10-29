/**
 * Stackra file contract:
 * Purpose: unit tests of `replicaReadsPorts`: a service with a `reads: "replica"` query reaches `ReplicaReads`, and its
 *          wiring then writes the port's driver table from `@stackra/database`'s manifest with the `DatabaseConfig`
 *          row; a hosted package whose manifest records a `reads: "replica"` query reaches it too, and `buildManifest`
 *          records `reads`; a service without one, and a package, reach nothing.
 * Boundary: test only; runs on the commerce IR fixture with a hand-built database manifest.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0057 (decision 6); STA-1504.
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

  it("makes the service wiring write the database's ReplicaReads table", () => {
    const content = emitWiring({ ...REPLICA, dependencies: [DATABASE] });
    for (const line of [
      "      port: ReplicaReads,",
      '      key: "actions.ReplicaReads",',
      '        "database": () => import("@stackra/database/node").then((m) => m.DatabaseReplicaReadsDriver),',
      '      deps: { "database": [DatabaseConfig] },',
    ])
      expect(content).toContain(line);
    expect(emitWiring({ ...COMMERCE_IR, dependencies: [DATABASE] })).not.toContain("ReplicaReads");
  });
});
