/**
 * Stackra file contract:
 * Purpose: proves the text driver's components line for line with colour off (golden text) and that colour on draws
 *          the same text with coloured status cells: a status table, a table cut to the width, a grouped checklist
 *          with its fix lines and summary, a folded and an expanded tree, the problem screen with and without
 *          `--verbose`, and `present` choosing a component by the shape of the data.
 * Boundary: unit test with memory streams.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-002, FR-003, FR-008 to FR-011, FR-021, AC-005 and SC-002; ADR 0022.
 */
// @covers sta-1966:FR-002 sta-1966:FR-003 sta-1966:FR-008 sta-1966:FR-009 sta-1966:FR-010 sta-1966:FR-011
// @covers sta-1966:FR-021 sta-1966:AC-005 sta-1966:SC-002
import type { ChecklistSpec } from "#contracts/types/checklist-spec.type";
import type { TableSpec } from "#contracts/types/table-spec.type";
import type { TreeNode } from "#contracts/types/tree-node.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { TextRendererDriver } from "#core/drivers/text-renderer.driver";
import { CommandError } from "#core/errors/command-error.error";
import { createOutput } from "#core/functions/create-output.function";
import { displayWidth } from "#core/functions/display-width.function";
import { problemOf } from "#core/functions/problem-of.function";
import { stripEscapes } from "#core/functions/strip-escapes.function";
import type { ConsoleMode } from "#core/types/console-mode.type";
import { memoryText } from "#testing/functions/memory-text.function";

const PLAIN: ConsoleMode = {
  bidi: "logical",
  depth: 0,
  unicode: true,
  interactive: false,
  json: false,
  quiet: false,
  verbose: false,
  animate: false,
  tty: false,
  columns: 40,
};

const draw = (mode: Partial<ConsoleMode> = {}) => {
  const stdout = memoryText();
  const stderr = memoryText();
  const renderer = new TextRendererDriver({
    mode: { ...PLAIN, ...mode },
    theme: STACKRA_THEME,
    version: "1.0.0",
    stdout,
    stderr,
  });
  return { renderer, stdout, stderr };
};

const TABLE: TableSpec = {
  columns: [
    { header: "Check", key: "check" },
    { header: "Status", key: "status", kind: "status" },
    { header: "Detail", key: "detail" },
  ],
  rows: [
    { check: "node", status: "ok", detail: "v24" },
    { check: "disk", status: "warn", detail: "12 GB" },
  ],
};

const CHECKLIST: ChecklistSpec = {
  rows: [
    { name: "node", status: "ok", detail: "v24.11.0", group: "Machine" },
    {
      name: "credentials",
      status: "fail",
      detail: "no credentials block",
      fix: "fflow init",
      group: "Repo",
      run: ["fflow", "init"],
    },
    { name: "disk", status: "warn", detail: "12 GB free", group: "Machine" },
  ],
};

const TREE: TreeNode[] = [
  {
    label: "apps/console",
    count: 12,
    note: "routes",
    children: [{ label: "routes", count: 8, children: [{ label: "home" }] }],
  },
  { label: "services/health", count: 3 },
];

describe("TextRendererDriver", () => {
  it("draws a status table with symbol and word in each status cell", () => {
    const { renderer, stdout } = draw();
    renderer.table(TABLE);
    expect(stdout.text()).toBe(
      [
        "  Check   Status   Detail",
        "  ─────   ──────   ──────",
        "  node    ✓ ok     v24",
        "  disk    ⚠ warn   12 GB",
        "",
      ].join("\n"),
    );
  });

  it("cuts the widest text column to fit the width, never the status", () => {
    const { renderer, stdout } = draw();
    renderer.table({ ...TABLE, rows: [{ check: "node", status: "fail", detail: "x".repeat(50) }] });
    const lines = stdout.text().trimEnd().split("\n");
    for (const line of lines) expect(displayWidth(line)).toBeLessThanOrEqual(40);
    expect(lines[2]).toContain("✗ fail");
    expect(lines[2]).toContain("…");
  });

  it("draws a grouped checklist with fix lines and a summary, and counts the rows", () => {
    const { renderer, stdout } = draw();
    const summary = renderer.checklist(CHECKLIST);
    expect(summary).toEqual({ passed: 1, warnings: 1, failed: 1, other: 0 });
    expect(stdout.text()).toBe(
      [
        " Machine",
        "  ✓ ok    node         v24.11.0",
        "  ⚠ warn  disk         12 GB free",
        " Repo",
        "  ✗ fail  credentials  no credentials block",
        `${" ".repeat(23)}fix: fflow init`,
        "",
        "  1 passed · 1 warning · 1 error",
        "",
      ].join("\n"),
    );
  });

  it("draws the checklist in ASCII without Unicode", () => {
    const { renderer, stdout } = draw({ unicode: false });
    renderer.checklist(CHECKLIST);
    expect(stdout.text()).toContain("  + ok    node");
    expect(stdout.text()).toContain("  x fail  credentials");
    expect(stdout.text()).toContain("1 passed - 1 warning - 1 error");
  });

  it("folds a tree below the first level of children, and expands it", () => {
    const folded = draw();
    folded.renderer.tree(TREE, false);
    expect(folded.stdout.text()).toBe(
      [
        "  ├─ apps/console  12  routes",
        "  │  └─ routes  8  (+1)",
        "  └─ services/health  3",
        "",
      ].join("\n"),
    );
    const open = draw();
    open.renderer.tree(TREE, true);
    expect(open.stdout.text()).toContain("  │     └─ home\n");
    expect(open.stdout.text()).not.toContain("(+1)");
  });

  it("draws one problem box on stderr, with the causes and detail only under --verbose", () => {
    const error = new CommandError("Not a git repository", {
      why: "/tmp has no .git",
      fix: "git init",
      detail: "fatal: not a git repository",
      cause: new Error("git exited 128"),
    });
    const quiet = draw();
    quiet.renderer.problem(problemOf(error), false);
    expect(quiet.stdout.text()).toBe("");
    expect(quiet.stderr.text()).toBe(
      [
        "",
        "  ╭─ ERROR ────────────────╮",
        "  │ Not a git repository   │",
        "  │ Why   /tmp has no .git │",
        "  │ Fix   git init         │",
        "  ╰────────────────────────╯",
        "",
        "",
      ].join("\n"),
    );
    const loud = draw();
    loud.renderer.problem(problemOf(error), true);
    expect(loud.stderr.text()).toContain("Caused by: git exited 128");
    expect(loud.stderr.text()).toContain("│ fatal: not a git repository");
  });

  it("draws the same text with colour on, the status cells coloured", () => {
    const plain = draw();
    const colour = draw({ depth: 24 });
    for (const { renderer } of [plain, colour]) {
      renderer.table(TABLE);
      renderer.checklist(CHECKLIST);
      renderer.tree(TREE, false);
      renderer.problem(problemOf(new CommandError("Broke", { fix: "retry" })), false);
    }
    expect(plain.stdout.text()).not.toContain("\u001B");
    expect(plain.stderr.text()).not.toContain("\u001B");
    expect(colour.stdout.text()).toContain("m✓ ok\u001B[");
    expect(stripEscapes(colour.stdout.text())).toBe(plain.stdout.text());
    expect(stripEscapes(colour.stderr.text())).toBe(plain.stderr.text());
  });

  it("writes nothing to stdout under --json or --quiet, and the problem only off --json", () => {
    for (const mode of [{ json: true }, { quiet: true }]) {
      const { renderer, stdout, stderr } = draw(mode);
      renderer.table(TABLE);
      renderer.checklist(CHECKLIST);
      renderer.problem(problemOf(new Error("x")), false);
      expect(stdout.text()).toBe("");
      expect(stderr.text() === "").toBe(mode.json === true);
    }
  });
});

/** Presents `data` through a facade over the text driver. */
const present = (data: unknown) => {
  const { renderer, stdout } = draw();
  const rows: unknown[] = [];
  let failed = false;
  createOutput({
    mode: PLAIN,
    renderer,
    onJson: () => undefined,
    onRows: (given) => rows.push(...given),
    onFailed: () => {
      failed = true;
    },
  }).present(data);
  return { text: stdout.text(), rows, failed };
};

describe("present", () => {
  it("draws checklist rows as a checklist, keeping every field as the rows", () => {
    const { text, rows, failed } = present(CHECKLIST.rows);
    expect(text).toContain("1 passed · 1 warning · 1 error");
    expect(rows).toEqual(CHECKLIST.rows);
    expect(failed).toBe(true);
  });

  it("draws records as a table and an object as key-value lines", () => {
    expect(present([{ name: "a", size: 1 }]).text).toContain("  name   size");
    expect(present({ version: "1.0.0" }).text).toMatch(/^ {2}version \.+ 1\.0\.0\n$/);
    expect(present(["one", "two"]).text).toBe("  • one\n  • two\n");
  });
});
