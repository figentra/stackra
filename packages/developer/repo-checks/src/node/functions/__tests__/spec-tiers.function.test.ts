/**
 * Stackra file contract:
 * Purpose: unit tests of the spec tiers (ADR 0502): `specTierOf` reads the header; `specComputedTier` raises the floor
 *          for migrations, contracts, permissions, money, new apps and Workers (feature) and new services and packages
 *          (big), and nothing for specs, docs and tests; `specCheckTier` refuses a declared tier below the floor (no spec:
 *          trivial); `specApprovedAt` and `specCheckApproval` read and require the stops; `specCheckStage` takes a small
 *          spec's plan and tasks from spec.md; `specFindings` checks the floor against the branch's own spec.
 * Boundary: test only; in-memory texts and repository.
 * Runtime: node (vitest)
 * Governing contract: ADR 0502; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { specApprovedAt } from "#node/functions/spec-approved-at.function";
import { specCheckApproval } from "#node/functions/spec-check-approval.function";
import { specCheckStage } from "#node/functions/spec-check-stage.function";
import { specCheckTier } from "#node/functions/spec-check-tier.function";
import { specComputedTier } from "#node/functions/spec-computed-tier.function";
import { specFindings } from "#node/functions/spec-findings.function";
import { specTierOf } from "#node/functions/spec-tier-of.function";

/** A spec at `status` of `tier`, with optional extra header and body lines. */
const spec = (status: string, tier: string, extra = ""): string =>
  [
    "# Feature Specification: widget",
    "",
    `**Status**: ${status}`,
    "",
    `**Tier**: ${tier}`,
    "",
    "**Linear**: OS-901",
    "",
    "**Clarifications status**: complete",
    "",
    extra,
  ].join("\n");

/** The tier findings of a branch whose diff adds a migration, its own spec at `tier` (none: no spec). */
const findings = (tier: string | undefined, branch = "os-901-x") =>
  specFindings({
    base: "origin/main",
    branch,
    requireReady: false,
    git: (args) =>
      args[0] === "diff" && args[1] === "--name-status"
        ? "A\tservices/orders/src/modules/orders/database/migrations/0002-x.migration.ts\n"
        : args[0] === "diff"
          ? "services/orders/src/modules/orders/database/migrations/0002-x.migration.ts\n"
          : "",
    exists: () => false,
    read: (path) =>
      path === ".agents/specs/os-901-widget/spec.md" && tier !== undefined
        ? spec("Draft", tier)
        : undefined,
    list: (path) => (path === ".agents/specs" ? ["os-901-widget"] : []),
  }).filter((f) => f.message.startsWith("tier:"));

describe("spec tiers (ADR 0502)", () => {
  it("reads the declared tier, and none from an older spec", () => {
    expect(specTierOf("**Tier**: Feature")).toBe("feature");
    expect(specTierOf("**Tier**: huge")).toBeUndefined();
    expect(specTierOf("**Status**: Draft")).toBeUndefined();
  });

  it("computes the floor from the diff", () => {
    expect(specComputedTier([{ status: "M", path: "packages/data/x/src/core/a.ts" }]).tier).toBe(
      "trivial",
    );
    expect(
      specComputedTier([
        {
          status: "A",
          path: "services/orders/src/modules/orders/database/migrations/0002-x.migration.ts",
        },
      ]),
    ).toEqual({
      tier: "feature",
      reasons: [
        "a migration: services/orders/src/modules/orders/database/migrations/0002-x.migration.ts",
      ],
    });
    for (const path of [
      "packages/security/iam/src/contracts/ports/x.port.ts",
      "services/orders/stackra.manifest.json",
      "services/orders/src/modules/orders/access/order.permissions.ts",
      "packages/commerce/ledger/src/core/a.ts",
      "services/pay/src/modules/refunds/actions/issue-refund.action.ts",
    ])
      expect(specComputedTier([{ status: "M", path }]).tier).toBe("feature");
    expect(specComputedTier([{ status: "A", path: "workers/edge/package.json" }]).tier).toBe(
      "feature",
    );
    expect(specComputedTier([{ status: "A", path: "packages/data/vault/package.json" }]).tier).toBe(
      "big",
    );
    expect(specComputedTier([{ status: "A", path: "services/pay/package.json" }]).tier).toBe("big");
    expect(specComputedTier([{ status: "M", path: "services/pay/package.json" }]).tier).toBe(
      "trivial",
    );
    for (const path of [
      ".agents/specs/os-1-x/spec.md",
      "apps/docs/src/docs/payments.mdx",
      "packages/commerce/ledger/README.md",
      "packages/commerce/ledger/src/core/__tests__/a.test.ts",
    ])
      expect(specComputedTier([{ status: "M", path }]).tier).toBe("trivial");
  });

  it("refuses a declared tier below the floor; no spec is trivial", () => {
    expect(specCheckTier({ declared: "feature", computed: "feature" })).toEqual([]);
    expect(specCheckTier({ declared: "big", computed: "feature" })).toEqual([]);
    expect(specCheckTier({ computed: "trivial" })).toEqual([]);
    expect(
      specCheckTier({ declared: "small", computed: "feature", reasons: ["a migration: m"] }),
    ).toEqual([
      "tier: the diff needs at least feature (a migration: m), but the spec declares small (ADR 0502)",
    ]);
    expect(
      specCheckTier({ computed: "big", reasons: ["a new service or package: p"] })[0],
    ).toContain("branch has no spec (trivial)");
  });

  it("reads an approval from the status line or the history line of its stage", () => {
    expect(specApprovedAt("**Status**: Planned — Approved by owner 2026-10-31", "planned")).toEqual(
      {
        who: "owner",
        date: "2026-10-31",
      },
    );
    const history =
      "**Status**: Tasked\n\n## Status history\n\n- 2026-10-31: Clarified → Planned — Approved by leader 2026-10-31\n";
    expect(specApprovedAt(history, "planned")).toEqual({ who: "leader", date: "2026-10-31" });
    expect(specApprovedAt(history, "clarified")).toBeUndefined();
  });

  it("stops a feature before Tasked and a big spec before Planned and Tasked", () => {
    const approver = "**Approver**: leader";
    expect(specCheckApproval(spec("Planned", "feature", approver))).toEqual([]);
    expect(specCheckApproval(spec("Tasked", "feature", approver))[0]).toContain("Planned approval");
    expect(
      specCheckApproval(spec("Tasked — Approved by owner 2026-10-31", "feature", approver)),
    ).toHaveLength(1);
    const approved = `${approver}\n\n## Status history\n\n- 2026-10-31: Clarified → Planned — Approved by leader 2026-10-31\n`;
    expect(specCheckApproval(spec("Tasked", "feature", approved))).toEqual([]);
    expect(specCheckApproval(spec("Planned", "big", approver))[0]).toContain("Clarified approval");
    expect(specCheckApproval(spec("Planned", "feature"))[0]).toContain("**Approver**");
    expect(specCheckApproval(spec("Tasked", "small"))).toEqual([]);
  });

  it("takes a small spec's plan and tasks from spec.md", () => {
    const history =
      "\n## Status history\n\n- 2026-10-31: Draft → Clarified\n- 2026-10-31: Clarified → Planned\n";
    const small = spec("Planned", "small", `## Impact\n\n${history}`);
    expect(
      specCheckStage("os-901-widget", small, { files: ["spec.md"], prefixes: ["os"] }),
    ).toContain("status planned needs a `## Plan` section in a small spec");
    expect(
      specCheckStage("os-901-widget", `${small}\n## Plan\n\nOne step.\n`, {
        files: ["spec.md"],
        prefixes: ["os"],
      }).filter((p) => /plan/i.test(p)),
    ).toEqual([]);
  });

  it("checks the diff's floor against the branch's own spec in specFindings", () => {
    expect(findings("small")).toHaveLength(1);
    expect(findings("feature")).toEqual([]);
    expect(findings(undefined)).toEqual([]);
    expect(findings("small", "os-902-other")[0]?.message).toContain("branch has no spec (trivial)");
  });
});
