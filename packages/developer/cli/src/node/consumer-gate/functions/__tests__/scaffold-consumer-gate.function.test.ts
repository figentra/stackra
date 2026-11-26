/**
 * Stackra file contract:
 * Purpose: unit tests of the consumer gate's `scaffold` consumer and pin dates (STA-2705): `loadConsumerGateMatrix`
 *          on scaffold entries and `pinned`, the committed matrix's runnable scaffold entry, `consumerGatePinAge`, the
 *          pin line of `renderConsumerGateSummary`, and `runConsumerGate` making the app with core's own CLI
 *          (`stackra create --starter --tarballs`, then `stackra new service --data` and the fixture), gating it in
 *          pack mode, stopping after a failed create, planning a dry run, and refusing a bad scaffold setup (exit 2).
 * Boundary: test only; temporary directories and a fake executor that writes what the CLI would, no pnpm, no git,
 *           no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0500 (decision 3); STA-1813 (FR-001, FR-013); STA-2705.
 */
// @covers sta-1813:FR-001 sta-1813:FR-004 sta-1813:FR-006 sta-1813:FR-010 sta-1813:FR-013
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { consumerGatePinAge } from "#node/consumer-gate/functions/consumer-gate-pin-age.function";
import { loadConsumerGateAllow } from "#node/consumer-gate/functions/load-consumer-gate-allow.function";
import { loadConsumerGateMatrix } from "#node/consumer-gate/functions/load-consumer-gate-matrix.function";
import { renderConsumerGateSummary } from "#node/consumer-gate/functions/render-consumer-gate-summary.function";
import { runConsumerGate } from "#node/consumer-gate/functions/run-consumer-gate.function";
import type { ConsumerGateDeps } from "#node/consumer-gate/types/consumer-gate-deps.type";

const TODAY = "2026-11-26";
const REF = "d78a4fa8d52865e4cdaa22333d8d19934eddcf46";
const REPOSITORY_ROOT = resolve(import.meta.dirname, "../../../../../../../..");
const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const write = (path: string, text: string): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

const SCAFFOLD = [
  "  scaffold:",
  "    kind: scaffold",
  "    repo: stackra-inc/stackra-template",
  `    ref: ${REF}`,
  '    pinned: "2026-11-20"',
  "    service: gate-example",
  "    fixture: tools/consumer-gate/scaffold-fixture",
  '    dependencies: { "@stackra/actions": "catalog:stackra" }',
  "    services: [example, gate-example]",
].join("\n");

/** A thunk loading a matrix of one entry, for `toThrow`. */
const load = (entry: string) => () => loadConsumerGateMatrix(`products:\n${entry}\n`);

describe("loadConsumerGateMatrix on scaffold entries and pin dates", () => {
  it("takes a scaffold with a starter repo and ref, a fixture and the service it adds", () => {
    expect(load(SCAFFOLD)()["scaffold"]).toMatchObject({
      kind: "scaffold",
      repo: "stackra-inc/stackra-template",
      ref: REF,
      service: "gate-example",
      pinned: "2026-11-20",
    });
  });

  it("refuses a scaffold without a starter, with pins, overlays or link mode, or adding an unlisted service", () => {
    expect(load(SCAFFOLD.replace(/\n {4}repo: .*/, ""))).toThrow(/repo and ref naming its starter/);
    expect(load(`${SCAFFOLD}\n    pins: { example: abc1234 }`)).toThrow(/no pins/);
    expect(load(SCAFFOLD.replace("service: gate-example", "service: other"))).toThrow(
      /the service it adds/,
    );
    expect(load(`${SCAFFOLD}\n    overlays: [tenancy]`)).toThrow(/takes no overlays/);
    expect(load(`${SCAFFOLD}\n    mode: link`)).toThrow(/its mode is pack/);
    expect(load(SCAFFOLD.replace('"catalog:stackra"', "1"))).toThrow(
      /map a package name to a spec/,
    );
  });

  it("refuses a pinned date that is not YYYY-MM-DD", () => {
    expect(load(SCAFFOLD.replace('"2026-11-20"', "26 Nov"))).toThrow(
      /write the date as YYYY-MM-DD/,
    );
    expect(load(SCAFFOLD.replace('"2026-11-20"', '"2026-13-45"'))).toThrow(/YYYY-MM-DD/);
  });

  it("commits a runnable scaffold pinned to a full template commit, and a pinned date on every entry", () => {
    const matrix = loadConsumerGateMatrix(
      readFileSync(join(REPOSITORY_ROOT, "tools/consumer-gate/matrix.yaml"), "utf8"),
    );
    expect(matrix["scaffold"]).toMatchObject({
      kind: "scaffold",
      mode: "pack",
      repo: "stackra-inc/stackra-template",
      service: "gate-example",
      fixture: "tools/consumer-gate/scaffold-fixture",
    });
    expect(matrix["scaffold"]?.ref).toMatch(/^[0-9a-f]{40}$/);
    expect(
      existsSync(
        join(REPOSITORY_ROOT, matrix["scaffold"]?.fixture ?? "", "src/modules/gate-example"),
      ),
    ).toBe(true);
    for (const [name, product] of Object.entries(matrix)) {
      expect([name, product.pinned]).toEqual([name, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)]);
    }
  });
});

describe("consumerGatePinAge", () => {
  it("is stale past 14 days or undated, fresh up to 14 days", () => {
    expect(consumerGatePinAge("2026-11-01", TODAY)).toEqual({
      pinned: "2026-11-01",
      ageDays: 25,
      stale: true,
    });
    expect(consumerGatePinAge("2026-11-12", TODAY)).toEqual({
      pinned: "2026-11-12",
      ageDays: 14,
      stale: false,
    });
    expect(consumerGatePinAge(undefined, TODAY)).toEqual({ stale: true });
  });
});

/** A built core with one package, the CLI's dist and the fixture; a starter checkout; the scaffold matrix. */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "consumer-gate-scaffold-"));
  dirs.push(dir);
  write(
    join(dir, "core/packages/data/model/package.json"),
    '{"name":"@stackra/model","version":"0.33.1"}',
  );
  write(join(dir, "core/packages/data/model/dist/index.js"), "");
  write(
    join(dir, "core/packages/developer/cli/package.json"),
    '{"name":"@stackra/cli","version":"0.33.1"}',
  );
  write(join(dir, "core/packages/developer/cli/dist/stackra.mjs"), "");
  write(
    join(dir, "core/tools/consumer-gate/scaffold-fixture/src/modules/gate-example/actions/a.ts"),
    "export const a = 1;\n",
  );
  write(join(dir, "starter/stackra.starter.yaml"), "version: 1\n");
  write(join(dir, "starter/pnpm-lock.yaml"), "starter lock\n");
  const options = {
    core: join(dir, "core"),
    checkout: join(dir, "starter"),
    product: "scaffold",
    out: join(dir, "out"),
    matrix: loadConsumerGateMatrix(`products:\n${SCAFFOLD}\n`),
    allow: loadConsumerGateAllow("allow: []\n", TODAY),
    today: TODAY,
  };
  return { dir, options };
}

const head = (dir: string): string => (dir.endsWith("starter") ? REF : "core0000");

type Call = { argv: readonly string[]; cwd: string };

/**
 * A fake executor that writes what `stackra create`, `stackra new service` and a tarball install would, and records
 * each call.
 */
function fakeCli(calls: Call[], failCreate = false): ConsumerGateDeps["exec"] {
  return (argv, { cwd, logFile }) => {
    calls.push({ argv, cwd });
    const command = argv[2];
    if (command === "create") {
      if (failCreate) {
        writeFileSync(logFile, "  ERROR  the starter has no profile minimal; it has full\n");
        return 1;
      }
      const root = argv[3] as string;
      write(join(root, "package.json"), '{"name":"consumer-gate","scripts":{"validate":"x"}}');
      write(join(root, "pnpm-workspace.yaml"), "packages: [services/*]\n");
      write(join(root, "services/example/package.json"), '{"name":"@consumer-gate/example"}');
    } else if (argv[1] === "install") {
      // What a tarball install leaves: a real folder, never a link into core.
      write(join(cwd, "node_modules/@stackra/model/package.json"), '{"name":"@stackra/model"}');
      write(join(cwd, "node_modules/@stackra/model/dist/index.js"), "");
    } else if (command === "new") {
      write(
        join(cwd, "services/gate-example/package.json"),
        JSON.stringify({
          name: "@consumer-gate/gate-example",
          scripts: { "test:int": "x" },
          dependencies: { "@stackra/database": "catalog:stackra" },
        }),
      );
    }
    writeFileSync(logFile, argv[1] === "--version" ? "12.16.1\n" : "fine\n");
    return 0;
  };
}

describe("runConsumerGate on a scaffold", () => {
  it("creates the app with core's own CLI on the tarballs, adds the service and fixture, and gates it", () => {
    const { dir, options } = fixture();
    const calls: Call[] = [];
    const result = runConsumerGate(options, { exec: fakeCli(calls), head });
    expect(result.error).toBeUndefined();
    expect(result.code).toBe(0);
    const root = join(options.out, `work/scaffold@${REF}`);
    const tarballs = join(options.out, "tarballs");
    const cli = join(options.core, "packages/developer/cli/dist/stackra.mjs");
    const create = calls.find((call) => call.argv[2] === "create");
    expect(create?.argv.slice(0, 4)).toEqual([process.execPath, cli, "create", root]);
    expect(create?.argv).toEqual(
      expect.arrayContaining(["--no-install", "--no-git", "--no-doctor", "--yes"]),
    );
    expect(create?.argv.join(" ")).toContain(
      `--starter ${options.checkout} --tarballs ${tarballs} --name consumer-gate --scope @consumer-gate --profile minimal`,
    );
    const added = calls.find((call) => call.argv[2] === "new");
    expect(added?.cwd).toBe(root);
    expect(added?.argv.slice(2, 8)).toEqual([
      "new",
      "service",
      "gate-example",
      "--area",
      "app",
      "--data",
    ]);
    expect(
      readFileSync(
        join(root, "services/gate-example/src/modules/gate-example/actions/a.ts"),
        "utf8",
      ),
    ).toBe("export const a = 1;\n");
    // The fixture's imports are added to the service as `pnpm add` would, beside what `new service` declared.
    expect(
      JSON.parse(readFileSync(join(root, "services/gate-example/package.json"), "utf8")),
    ).toMatchObject({
      dependencies: {
        "@stackra/database": "catalog:stackra",
        "@stackra/actions": "catalog:stackra",
      },
    });
    // Packed before the app is made, since create reads the tarball folder.
    const packed = calls.findIndex((call) => call.argv[1] === "pack");
    expect(packed).toBeGreaterThanOrEqual(0);
    expect(packed).toBeLessThan(calls.indexOf(create as Call));
    expect(result.summary?.steps.map((step) => step.id)).toEqual([
      "core-pack",
      "scaffold/create",
      "scaffold/service",
      "install",
      "leak",
      "build-deps",
      "gen/example",
      "gen/gate-example",
      "typecheck",
      "lint",
      "build",
      "test",
      "test:int/example",
      "test:int/gate-example",
      "format",
      "spell",
      "validate",
    ]);
    expect(result.summary?.steps.find((step) => step.id === "validate")?.status).toBe("pass");
    // A scaffold's repo-own steps run in the app itself: the starter checkout is never copied back in or written.
    expect(calls.find((call) => call.argv.includes("validate"))?.cwd).toBe(root);
    expect(existsSync(join(dir, "starter/pnpm-workspace.yaml"))).toBe(false);
    expect(readFileSync(join(dir, "starter/pnpm-lock.yaml"), "utf8")).toBe("starter lock\n");
    expect(result.summary?.mode).toBe("pack");
    expect(result.summary?.pin).toEqual({ pinned: "2026-11-20", ageDays: 6, stale: false });
    const markdown = readFileSync(join(options.out, `summary-scaffold@${REF}.md`), "utf8");
    expect(markdown).toContain(`Pin \`${REF}\` set 2026-11-20, 6 day(s) before this run.`);
    expect(markdown).toMatch(/\| scaffold\/create \| PASS \|/);
  });

  it("stops after a failed create: the service and every step are skipped, and the run is RED", () => {
    const { options } = fixture();
    const calls: Call[] = [];
    const result = runConsumerGate(options, { exec: fakeCli(calls, true), head });
    expect(result.code).toBe(1);
    const steps = result.summary?.steps ?? [];
    expect(steps.find((step) => step.id === "scaffold/create")).toMatchObject({
      status: "fail",
      uncovered: ["ERROR  the starter has no profile minimal; it has full"],
    });
    expect(steps.find((step) => step.id === "scaffold/service")?.status).toBe("skipped");
    expect([...new Set(steps.slice(3).map((step) => step.status))]).toEqual(["skipped"]);
    expect(calls.some((call) => call.argv.includes("install"))).toBe(false);
  });

  it("plans a dry run without running the CLI", () => {
    const { options } = fixture();
    const calls: Call[] = [];
    const dry = runConsumerGate({ ...options, dryRun: true }, { exec: fakeCli(calls), head });
    expect(dry.code).toBe(0);
    expect(calls).toEqual([]);
    expect(dry.summary?.steps[0]).toMatchObject({
      id: "scaffold/create",
      status: "skipped",
      reason: expect.stringMatching(/^dry run: stackra create .* --starter /),
    });
    expect(dry.summary?.steps.every((step) => step.status === "skipped")).toBe(true);
  });

  it("refuses link mode, a checkout that is no starter, a core without the CLI and a fixture outside core", () => {
    const { dir, options } = fixture();
    const deps = { exec: fakeCli([]), head };
    expect(runConsumerGate({ ...options, mode: "link" }, deps).error).toMatch(
      /run it in pack mode/,
    );
    rmSync(join(dir, "starter/stackra.starter.yaml"));
    expect(runConsumerGate(options, deps).error).toMatch(/not a starter/);
    write(join(dir, "starter/stackra.starter.yaml"), "version: 1\n");
    rmSync(join(dir, "core/packages/developer/cli/dist"), { recursive: true });
    expect(runConsumerGate(options, deps).error).toMatch(/no built CLI/);
    write(join(dir, "core/packages/developer/cli/dist/stackra.mjs"), "");
    const outside = loadConsumerGateMatrix(
      `products:\n${SCAFFOLD.replace("tools/consumer-gate/scaffold-fixture", "../elsewhere")}\n`,
    );
    const result = runConsumerGate({ ...options, matrix: outside }, deps);
    expect(result.code).toBe(2);
    expect(result.error).toMatch(/not in the core tree/);
  });
});

describe("renderConsumerGateSummary pin line", () => {
  it("flags a stale or undated pin and says how to move it", () => {
    const { options } = fixture();
    const run = runConsumerGate(
      { ...options, today: "2026-12-20", dryRun: true },
      { exec: fakeCli([]), head },
    );
    const summary = run.summary;
    expect(summary).toBeDefined();
    if (summary === undefined) return;
    expect(renderConsumerGateSummary(summary)).toContain(
      `Pin \`${REF}\` set 2026-11-20, 30 day(s) before this run: STALE (older than 14 days or undated); move it`,
    );
    expect(renderConsumerGateSummary({ ...summary, pin: { stale: true } })).toContain(
      `Pin \`${REF}\` has no \`pinned\` date in the matrix: STALE`,
    );
  });
});
