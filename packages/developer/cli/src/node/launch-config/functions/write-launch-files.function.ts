/**
 * Stackra file contract:
 * Purpose: `writeLaunchFiles(root, check)`, the launch step of `stackra gen` at a workspace root with a root runway:
 *          renders Claude's `.claude/launch.json` and VS Code's `dev: …` tasks in `.vscode/tasks.json` from the runways
 *          and writes each file whose parsed content differs; with `check` writes nothing and reports it `stale`.
 * Boundary: compares parsed JSON, so oxfmt's layout of a committed file never counts and a current file is never
 *           rewritten. Writes only those two files. A tasks file that does not parse is `stale` and left alone.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5, amendment of 2026-11-03); STA-2081.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isDeepStrictEqual } from "node:util";

import { LAUNCH_FILE } from "#node/launch-config/constants/launch-file.constant";
import { VSCODE_TASKS_FILE } from "#node/launch-config/constants/vscode-tasks-file.constant";
import { readLaunchInputs } from "#node/launch-config/functions/read-launch-inputs.function";
import { renderLaunchConfig } from "#node/launch-config/functions/render-launch-config.function";
import { renderVscodeTasks } from "#node/launch-config/functions/render-vscode-tasks.function";

/** The text of `path`, or undefined when it does not exist. */
const textOf = (path: string): string | undefined =>
  existsSync(path) ? readFileSync(path, "utf8") : undefined;

/** The parsed JSON of `text` with its whole-line comments dropped, or undefined. */
function parsed(text: string | undefined): unknown {
  try {
    return text === undefined
      ? undefined
      : JSON.parse(
          text
            .split("\n")
            .filter((line) => !line.trimStart().startsWith("//"))
            .join("\n"),
        );
  } catch {
    return undefined;
  }
}

/**
 * Brings the launch files of `root` up to date, or with `check` reports which are stale.
 *
 * @example
 * writeLaunchFiles(root, false); // [{ file: ".claude/launch.json", status: "written" }, …] the first time
 */
export function writeLaunchFiles(
  root: string,
  check: boolean,
): readonly { readonly file: string; readonly status: "current" | "written" | "stale" }[] {
  const launch = renderLaunchConfig(readLaunchInputs(root));
  const tasksText = textOf(join(root, VSCODE_TASKS_FILE));
  const tasks = renderVscodeTasks(tasksText, launch);
  const files = [
    { file: LAUNCH_FILE, expected: launch, text: `${JSON.stringify(launch, null, 2)}\n` },
    {
      file: VSCODE_TASKS_FILE,
      expected: tasks?.document,
      text:
        tasks === undefined
          ? undefined
          : `${[...tasks.header, JSON.stringify(tasks.document, null, 2)].join("\n")}\n`,
    },
  ];
  return files.map(({ file, expected, text }) => {
    const path = join(root, file);
    const current = file === VSCODE_TASKS_FILE ? tasksText : textOf(path);
    if (expected !== undefined && isDeepStrictEqual(parsed(current), expected))
      return { file, status: "current" as const };
    if (check || text === undefined) return { file, status: "stale" as const };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    return { file, status: "written" as const };
  });
}
