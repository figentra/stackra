/**
 * Stackra file contract:
 * Purpose: unit tests of the spec tiers (ADR 0502): `specTierOf` reads the header; `specComputedTier` raises the floor
 *          for migrations, contracts, permissions, money, new apps and Workers (feature) and new services and packages
 *          (big), and nothing for specs, docs and tests; `specCheckTier` refuses a declared tier below the floor (no spec:
 *          trivial); `specApprovedAt` and `specCheckApproval` read and require the stops; `specCheckStage` takes a small
 *          spec's short design and tasks from spec.md; `specCheckCriteria`, `specCheckDesign` and `specCheckTraceTasks`
 *          hold the Kiro depth (EARS criteria, the nine design sections, tasks traced to criteria and files);
 *          `specFindings` checks the floor against the branch's own spec.
 * Boundary: test only; in-memory texts and repository.
 * Runtime: node (vitest)
 * Governing contract: ADR 0502; ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { specApprovedAt } from "#node/functions/spec-approved-at.function";
import { specCheckApproval } from "#node/functions/spec-check-approval.function";
import { specCheckCriteria } from "#node/functions/spec-check-criteria.function";
import { specCheckDesign } from "#node/functions/spec-check-design.function";
import { specCheckStage } from "#node/functions/spec-check-stage.function";
import { specCheckTier } from "#node/functions/spec-check-tier.function";
import { specCheckTraceTasks } from "#node/functions/spec-check-trace-tasks.function";
import { specComputedTier } from "#node/functions/spec-computed-tier.function";
import { specFindings } from "#node/functions/spec-findings.function";
import { specTierOf } from "#node/functions/spec-tier-of.function";
import { SPEC_DESIGN_SECTIONS } from "#node/constants/spec-design-sections.constant";

/** One EARS criterion. */
const CRITERIA =
  "## Acceptance criteria\n\n- **AC-001**: WHEN a pass is issued THE wallet SHALL show it\n";

/** A task covering AC-001 in one file. */
const TASK = "- [ ] T001 Show the pass in `src/wallet.ts` — covers: AC-001 — route: spec-task";

/** A design whose nine sections each say "none", as `level` headings. */
const DESIGN = (level: "##" | "###"): string =>
  `${level === "###" ? "## Design\n\n" : ""}${SPEC_DESIGN_SECTIONS.map((name) => `${level} ${name}\n\nnone\n`).join("\n")}`;

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

/** The design, tasks and criteria problems of a small spec text. */
const stage = (text: string): string[] =>
  specCheckStage("os-901-widget", text, { files: ["spec.md"], prefixes: ["os"] }).filter((p) =>
    /Design|Tasks|AC-|task/.test(p),
  );

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

  it("takes a small spec's short design and tasks from spec.md", () => {
    const history =
      "\n## Status history\n\n- 2026-10-31: Draft → Clarified\n- 2026-10-31: Clarified → Tasked\n";
    const small = spec("Tasked", "small", `${CRITERIA}${history}`);
    expect(stage(small)).toEqual([
      "status tasked needs a `## Design` section in a small spec",
      "status tasked needs a `## Tasks` section in a small spec",
    ]);
    expect(stage(`${small}\n${DESIGN("###")}\n## Tasks\n\n${TASK}\n`)).toEqual([]);
    expect(
      stage(`${small}\n## Design\n\n### Architecture overview\n\nnone\n\n## Tasks\n\n${TASK}\n`),
    ).toHaveLength(8);
  });

  it("requires EARS criteria with ids from a tiered spec past Draft", () => {
    expect(specCheckCriteria(CRITERIA)).toEqual([]);
    expect(specCheckCriteria("## Impact\n")[0]).toContain("`## Acceptance criteria`");
    expect(specCheckCriteria("## Acceptance criteria\n\nnone\n")[0]).toContain(
      "no `- **AC-###**:`",
    );
    for (const ok of [
      "IF the card is declined THEN THE checkout SHALL show the reason",
      "WHILE the device is offline THE queue SHALL keep the call",
      "WHERE loyalty is enabled THE receipt SHALL show the points",
      "THE ledger SHALL never change a posted line",
    ])
      expect(specCheckCriteria(`## Acceptance criteria\n\n- **AC-001**: ${ok}\n`)).toEqual([]);
    expect(
      specCheckCriteria("## Acceptance criteria\n\n- **AC-001**: the wallet shows the pass\n")[0],
    ).toContain("AC-001 is not EARS");
  });

  it("requires the design's nine sections, each with something under it", () => {
    expect(specCheckDesign(DESIGN("##"), "plan.md", "##")).toEqual([]);
    const missing = specCheckDesign(
      DESIGN("##").replace("## Rollout\n\nnone\n", ""),
      "plan.md",
      "##",
    );
    expect(missing).toEqual(["plan.md: the design has no `## Rollout` section (ADR 0502)"]);
    expect(
      specCheckDesign(
        DESIGN("##").replace("## Contracts\n\nnone\n", "## Contracts\n\n"),
        "plan.md",
        "##",
      )[0],
    ).toContain("`## Contracts` is empty");
  });

  it("traces each task to a criterion and a file, and every criterion to a task", () => {
    expect(specCheckTraceTasks(TASK, CRITERIA, "tasks.md", ["os"])).toEqual([]);
    expect(
      specCheckTraceTasks(
        "- [ ] T001 Write it — covers: FR-001 — route: spec-task",
        CRITERIA,
        "tasks.md",
        ["os"],
      ),
    ).toEqual([
      "tasks.md:1: T001 covers no acceptance criterion (AC-###) of spec.md (ADR 0502)",
      "tasks.md:1: T001 names no file in backticks (ADR 0502)",
      "tasks.md: AC-001 is covered by no task",
    ]);
  });

  it("checks the diff's floor against the branch's own spec in specFindings", () => {
    expect(findings("small")).toHaveLength(1);
    expect(findings("feature")).toEqual([]);
    expect(findings(undefined)).toEqual([]);
    expect(findings("small", "os-902-other")[0]?.message).toContain("branch has no spec (trivial)");
  });
});
