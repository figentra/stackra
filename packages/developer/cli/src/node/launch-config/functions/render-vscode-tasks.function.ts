/**
 * Stackra file contract:
 * Purpose: `renderVscodeTasks(text, launch)`, VS Code's `.vscode/tasks.json` with one background `dev: <name>` task per
 *          server of the launch file (the same command and port Claude runs), after the file's hand-written tasks.
 *          Answers the leading comment lines and the document, or undefined when the current text does not parse.
 * Boundary: pure. Owns only the tasks labelled `dev: …`; keeps every other task and key as written. Comment lines
 *           inside the JSON are not kept, so the file holds comments only at its top.
 * Runtime: node
 * Governing contract: ADR 0295 (amendment of 2026-11-03); STA-2081.
 */
import { DEV_TASK_PREFIX } from "#node/launch-config/constants/dev-task-prefix.constant";
import type { LaunchConfig } from "#node/launch-config/types/launch-config.type";
import type { VscodeTasks } from "#node/launch-config/types/vscode-tasks.type";

/** The header a new tasks file opens with. */
const NEW_HEADER = [
  "// Tasks for the command palette (Tasks: Run Task); `dev: …` tasks are written by stackra gen.",
];

/**
 * The tasks file for `launch`, keeping the hand-written tasks of `text` (undefined when there is no file yet).
 *
 * @example
 * renderVscodeTasks(undefined, launch)?.document.tasks.map((task) => task.label); // ["dev: docs"]
 */
export function renderVscodeTasks(
  text: string | undefined,
  launch: LaunchConfig,
): VscodeTasks | undefined {
  const lines = (text ?? "").split("\n");
  const firstCode = lines.findIndex((line) => !line.trimStart().startsWith("//"));
  const header = text === undefined ? NEW_HEADER : lines.slice(0, Math.max(firstCode, 0));
  let current: Record<string, unknown> = { version: "2.0.0", tasks: [] };
  if (text !== undefined)
    try {
      current = JSON.parse(
        lines.filter((line) => !line.trimStart().startsWith("//")).join("\n"),
      ) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  const kept = (Array.isArray(current["tasks"]) ? (current["tasks"] as unknown[]) : []).filter(
    (task) =>
      !String((task as { readonly label?: unknown }).label ?? "").startsWith(DEV_TASK_PREFIX),
  );
  const generated = launch.configurations.map(({ name, runtimeArgs, port }) => ({
    label: `${DEV_TASK_PREFIX}${name}`,
    detail: `Start ${name} on http://localhost:${port} (written by stackra gen from the runways)`,
    type: "shell",
    command: runtimeArgs.at(-1),
    isBackground: true,
    problemMatcher: [],
  }));
  return { header, document: { ...current, tasks: [...kept, ...generated] } };
}
