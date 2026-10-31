/**
 * Stackra file contract:
 * Purpose: proves the output components write the shared layout: messages to the right stream, key-value dots, boxed
 *          notes (ASCII without Unicode), task lines with DONE and FAIL, a plain spinner and plain progress, JSON data,
 *          silence under --quiet and --json, and no escape byte at depth 0.
 * Boundary: unit test with memory streams.
 * Runtime: node
 * Governing contract: STA-1730 spec FR-018, FR-021, FR-022 and SC-003; ADR 0022 (test placement).
 */
// @covers sta-1730:FR-018 sta-1730:FR-021 sta-1730:SC-003
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { createOutput } from "#core/functions/create-output.function";
import type { ConsoleMode } from "#core/types/console-mode.type";
import { memoryText } from "#testing/functions/memory-text.function";

const PLAIN: ConsoleMode = {
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

const setup = (mode: Partial<ConsoleMode> = {}) => {
  const stdout = memoryText();
  const stderr = memoryText();
  const data: unknown[] = [];
  const output = createOutput({
    mode: { ...PLAIN, ...mode },
    theme: STACKRA_THEME,
    version: "1.0.0",
    stdout,
    stderr,
    onJson: (value) => data.push(value),
  });
  return { output, stdout, stderr, data };
};

describe("createOutput", () => {
  it("writes info and success to stdout, warnings and errors to stderr", () => {
    const { output, stdout, stderr } = setup();
    output.info("one");
    output.success("two");
    output.warn("three");
    output.error("four");
    expect(stdout.text()).toBe("  ● one\n  ✓ two\n");
    expect(stderr.text()).toBe("  ▲ three\n  ✕ four\n");
  });

  it("fills key-value lines with dots to the width", () => {
    const { output, stdout } = setup();
    output.keyValue({ Version: "1.0.0" });
    expect(stdout.text()).toMatch(/^ {2}Version \.{3,} 1\.0\.0\n$/);
  });

  it("draws a note box, in ASCII without Unicode", () => {
    const { output, stdout } = setup({ unicode: false });
    output.note("Run the build next");
    const lines = stdout.text().trimEnd().split("\n");
    expect(lines[0]).toMatch(/^ {2}\+- Note -+\+$/);
    expect(lines[1]).toMatch(/^ {2}\| Run the build next +\|$/);
    expect(lines.at(-1)).toMatch(/^ {2}\+-+\+$/);
  });

  it("writes DONE after a task and FAIL (rethrowing) after a failed one", async () => {
    const { output, stdout, stderr } = setup();
    expect(await output.task("Build", () => 42)).toBe(42);
    expect(stdout.text()).toMatch(/Build \.+ \d+ms DONE\n$/);
    await expect(output.task("Ship", () => Promise.reject(new Error("no")))).rejects.toThrow("no");
    expect(stderr.text()).toMatch(/Ship \.+ \d+ms FAIL\n$/);
  });

  it("writes a plain spinner as one start line and one end line", () => {
    const { output, stdout } = setup();
    output.spinner("Working").stop("Worked");
    expect(stdout.text()).toBe("  ● Working...\n  ✓ Worked\n");
  });

  it("writes plain progress at most once per 10 percent", () => {
    const { output, stdout } = setup();
    const progress = output.progress(100, "Rows");
    for (let step = 0; step < 100; step += 1) progress.advance();
    progress.finish();
    expect(stdout.text().trimEnd().split("\n")).toHaveLength(11);
  });

  it("hands JSON data over under --json and writes no text", () => {
    const { output, stdout, stderr, data } = setup({ json: true });
    output.info("hidden");
    output.error("hidden");
    output.json({ rows: 3 });
    expect(stdout.text() + stderr.text()).toBe("");
    expect(data).toEqual([{ rows: 3 }]);
  });

  it("writes only errors under --quiet", () => {
    const { output, stdout, stderr } = setup({ quiet: true });
    output.success("hidden");
    output.error("shown");
    expect(stdout.text()).toBe("");
    expect(stderr.text()).toContain("shown");
  });

  it("writes no escape byte at depth 0", () => {
    const { output, stdout } = setup({ tty: true });
    output.banner();
    output.title("Title");
    output.table(["A"], [["b"]]);
    expect(stdout.text()).toContain("|___/");
    expect(stdout.text()).not.toContain("\u001B");
  });
});
