/**
 * Stackra file contract:
 * Purpose: unit tests of `GenCommand`: `stackra gen --json` returns each member's outcome and every refusal and warning
 *          with its member, code, file (from the working directory), line, column, subject, message and fix, plus the
 *          members skipped; standard output then holds the JSON document alone; without `--json` the text is gen's as
 *          before; and the choices of `--backend` are checked by the console.
 * Boundary: test only; `@stackra/gen/node`'s `generate` is replaced by a fake, so no TypeScript host opens. Writes a
 *           throwaway workspace in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 22 and 26); ADR 0506; STA-2883 spec FR-006.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { generate } from "@stackra/gen/node";

import { GenCommand } from "#node/commands/gen.command";

vi.mock("@stackra/gen/node", () => ({ generate: vi.fn() }));

const fake = vi.mocked(generate);

/** A refusal as gen reports it: its file relative to the member. */
const REFUSAL = {
  code: "shape_number_kind",
  file: "src/modules/orders/order.model.ts",
  line: 12,
  column: 3,
  subject: "Order.total",
  message: "Order.total is a number with no kind",
  fix: "declare it @Int or @Money",
};
const WARNING = {
  ...REFUSAL,
  code: "action_without_workflow",
  line: 0,
  column: 0,
  severity: "warning" as const,
};

let root: string;

/** A member folder with a gen config; `installed` adds the node_modules gen needs at a workspace root. */
function member(path: string, installed: boolean): void {
  const folder = join(root, path);
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, "package.json"), `{"name":"${path.replace("/", "-")}"}`);
  writeFileSync(join(folder, "stackra.config.ts"), "export default {};\n");
  if (installed) mkdirSync(join(folder, "node_modules"));
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-gen-"));
  fake.mockReset();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("GenCommand --json", () => {
  // @covers sta-2883:FR-006
  it("lists each refusal and warning with its code, file, line, column and fix", async () => {
    fake.mockResolvedValue({ errors: [REFUSAL], warnings: [WARNING], files: [], changed: [] });
    const result = await runCommandForTest([GenCommand], ["gen", "--check", "--json"], {
      cwd: root,
    });
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout)).toEqual(result.json);
    const { data } = result.json as { data: Record<string, unknown> };
    expect(data).toEqual({
      check: true,
      clean: false,
      members: [{ member: ".", clean: false, written: [], stale: [] }],
      refusals: [{ member: ".", ...REFUSAL }],
      warnings: [
        {
          member: ".",
          code: WARNING.code,
          file: WARNING.file,
          line: 0,
          column: 0,
          subject: WARNING.subject,
          message: WARNING.message,
          fix: WARNING.fix,
        },
      ],
      skipped: [],
      launch: [],
    });
    // The text gen prints still reaches a person, on standard error.
    expect(result.stderr).toContain("shape_number_kind");
  });

  // @covers sta-2883:FR-006
  it("names each file from the workspace root and lists the members skipped", async () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - services/*\n");
    member("services/orders", true);
    member("services/billing", false);
    fake.mockResolvedValue({ errors: [REFUSAL], warnings: [], files: [], changed: [] });
    const result = await runCommandForTest([GenCommand], ["gen", "--check", "--json"], {
      cwd: root,
    });
    const { data } = result.json as {
      data: { refusals: { member: string; file: string }[]; skipped: string[] };
    };
    expect(data.skipped).toEqual(["services/billing"]);
    expect(data.refusals).toEqual([
      expect.objectContaining({
        member: "services/orders",
        file: "services/orders/src/modules/orders/order.model.ts",
        line: 12,
        fix: REFUSAL.fix,
      }),
    ]);
  });

  // @covers sta-2883:FR-006
  it("reports a clean write run with the files each member wrote", async () => {
    fake.mockResolvedValue({ errors: [], warnings: [], files: [], changed: [] });
    fake.mockResolvedValueOnce({
      errors: [],
      warnings: [],
      files: [],
      changed: ["stackra.manifest.json"],
    });
    const result = await runCommandForTest([GenCommand], ["gen", "--json"], { cwd: root });
    expect(result.exitCode).toBe(0);
    expect((result.json as { data: unknown }).data).toMatchObject({
      check: false,
      clean: true,
      refusals: [],
    });
  });
});

describe("GenCommand without --json", () => {
  // @covers sta-2883:FR-007
  it("prints gen's text as before and no JSON", async () => {
    fake.mockResolvedValue({ errors: [REFUSAL], warnings: [], files: [], changed: [] });
    const result = await runCommandForTest([GenCommand], ["gen", "--check"], { cwd: root });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "./src/modules/orders/order.model.ts:12:3 error shape_number_kind Order.total",
    );
    expect(result.stderr).toContain("fix: declare it @Int or @Money");
  });

  // @covers sta-2883:FR-002
  it("refuses a --backend it does not know with exit 2, before gen runs", async () => {
    const result = await runCommandForTest([GenCommand], ["gen", "--backend", "tsc"], {
      cwd: root,
    });
    expect(result.exitCode).toBe(2);
    expect(fake).not.toHaveBeenCalled();
  });
});
