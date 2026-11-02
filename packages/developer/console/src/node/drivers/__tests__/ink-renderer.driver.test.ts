/**
 * Stackra file contract:
 * Purpose: proves the Ink driver draws like the text driver and never imports Ink while output does not animate, and
 *          that while it animates a live view, a spinner and a task redraw through Ink and end in the text driver's
 *          static lines, with the Ink frame cleared.
 * Boundary: unit test; `ink` and `react` are replaced by fakes that count imports and record renders.
 * Runtime: node
 * Governing contract: STA-1966 spec FR-004, SC-004 and AC-001; ADR 0022 (test placement).
 */
// @covers sta-1966:FR-004 sta-1966:SC-004
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import type { ConsoleMode } from "#core/types/console-mode.type";
import { InkRendererDriver } from "#node/drivers/ink-renderer.driver";
import { memoryText } from "#testing/functions/memory-text.function";

const fake = vi.hoisted(() => ({
  imports: 0,
  renders: 0,
  rerenders: 0,
  cleared: 0,
  lines: [] as string[],
}));

/** The text of every element under `node`. */
function textOf(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  const children = (node as { children?: unknown } | null)?.children;
  return children === undefined ? [] : textOf(children);
}

vi.mock("ink", () => {
  fake.imports += 1;
  return {
    Box: "Box",
    Text: "Text",
    render: (tree: unknown) => {
      fake.renders += 1;
      fake.lines = textOf(tree);
      return {
        rerender: (next: unknown) => {
          fake.rerenders += 1;
          fake.lines = textOf(next);
        },
        clear: () => {
          fake.cleared += 1;
        },
        unmount: () => undefined,
      };
    },
  };
});

vi.mock("react", () => ({
  createElement: (type: unknown, props: { children?: unknown }) => ({
    type,
    children: props.children,
  }),
}));

const MODE: ConsoleMode = {
  bidi: "logical",
  depth: 0,
  unicode: true,
  interactive: true,
  json: false,
  quiet: false,
  verbose: false,
  animate: false,
  tty: true,
  columns: 60,
};

const draw = (animate: boolean) => {
  const stdout = memoryText();
  const stderr = memoryText();
  const renderer = new InkRendererDriver({
    mode: { ...MODE, animate },
    theme: STACKRA_THEME,
    version: "1.0.0",
    stdout,
    stderr,
  });
  return { renderer, stdout };
};

/** Lets the dynamic import and its continuation settle. */
const settle = async () => {
  await vi.dynamicImportSettled();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

describe("InkRendererDriver", () => {
  it("draws as text and never imports Ink while output does not animate", async () => {
    const { renderer, stdout } = draw(false);
    const live = renderer.live({ rows: [{ name: "node", status: "running" }] });
    live.update("node", { status: "ok", detail: "v24" });
    live.stop();
    await renderer.task("Install", () => 1);
    renderer.spinner("Waiting").stop("Done");
    await settle();
    expect(fake.imports).toBe(0);
    expect(stdout.text()).toContain("✓ ok    node  v24");
    expect(stdout.text()).toContain("DONE");
  });

  it("redraws a live view through Ink and ends in the final checklist", async () => {
    const { renderer, stdout } = draw(true);
    const live = renderer.live({
      title: "Checks",
      rows: [
        { name: "node", status: "running" },
        { name: "git", status: "pending" },
      ],
    });
    await settle();
    expect(fake.imports).toBe(1);
    expect(fake.renders).toBe(1);
    expect(fake.lines.some((line) => line.includes("node") && line.includes("running"))).toBe(true);
    live.update("node", { status: "ok" });
    expect(fake.lines.some((line) => line.includes("✓ ok") && line.includes("node"))).toBe(true);
    live.update("git", { status: "fail", fix: "brew install git" });
    const summary = live.stop();
    expect(fake.cleared).toBe(1);
    expect(summary).toEqual({ passed: 1, warnings: 0, failed: 1, other: 0 });
    expect(stdout.text()).toContain("✗ fail  git");
    expect(stdout.text()).toContain("fix: brew install git");
  });

  it("shows a running task through Ink, then the text driver's DONE line", async () => {
    const { renderer, stdout } = draw(true);
    const before = fake.cleared;
    const result = await renderer.task("Install", async () => {
      await settle();
      expect(fake.lines.some((line) => line.includes("Install"))).toBe(true);
      return 7;
    });
    expect(result).toBe(7);
    expect(fake.cleared).toBe(before + 1);
    expect(stdout.text()).toMatch(/Install \.+ \d+ms DONE/);
  });
});
