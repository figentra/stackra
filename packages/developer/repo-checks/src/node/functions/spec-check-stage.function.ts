/**
 * Stackra file contract:
 * Purpose: `specCheckStage(folder, text, context)`, the stage rules for a spec at its declared `**Status**`: a status
 *          may lag its artifacts, never lead them. A tiered spec has EARS acceptance criteria; a `small` spec keeps a
 *          short design and its tasks in spec.md (`## Design`, `## Tasks`); a `feature` or `big` spec's plan.md is the
 *          design, its tasks trace to criteria and files, and it passes its approval stops (ADR 0502).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPEC_STATUSES } from "../constants/spec-statuses.constant.ts";
import { specAtLeast } from "./spec-at-least.function.ts";
import { specCheckApproval } from "./spec-check-approval.function.ts";
import { specCheckClarified } from "./spec-check-clarified.function.ts";
import { specCheckCriteria } from "./spec-check-criteria.function.ts";
import { specCheckDesign } from "./spec-check-design.function.ts";
import { specCheckPlan } from "./spec-check-plan.function.ts";
import { specCheckTasks } from "./spec-check-tasks.function.ts";
import { specCheckTraceTasks } from "./spec-check-trace-tasks.function.ts";
import { specFolderOf } from "./spec-folder-of.function.ts";
import { specFolderShape } from "./spec-folder-shape.function.ts";
import { specParseTasks } from "./spec-parse-tasks.function.ts";
import { specStatusOf } from "./spec-status-of.function.ts";
import { specStrip } from "./spec-strip.function.ts";
import { specTierOf } from "./spec-tier-of.function.ts";

/**
 * Problems for a spec at its declared status.
 *
 * @param folder - the spec folder name (`os-12-billing`).
 * @param text - the spec.md text.
 * @param context - the folder's file names, tasks.md and plan.md texts, the known task types and the repository's prefixes.
 * @example
 * specCheckStage("os-12-billing", spec, { files: ["spec.md"], prefixes: ["os"] });
 */
export function specCheckStage(
  folder: string,
  text: string,
  context: {
    files?: readonly string[];
    tasks?: string;
    plan?: string;
    known?: ReadonlySet<string> | undefined;
    prefixes?: readonly string[];
  } = {},
): string[] {
  const { files = [], tasks = "", plan = "", known, prefixes = [] } = context;
  const body = specStrip(text);
  const parsed = specFolderOf(folder);
  if (!parsed || (prefixes.length > 0 && !prefixes.includes(parsed.prefix)))
    return [`folder \`${folder}\` is not \`${specFolderShape(prefixes)}\` (ADR 0120 D1)`];
  const key = parsed.number;
  const upper = parsed.prefix.toUpperCase();
  const status = specStatusOf(text);
  if (!SPEC_STATUSES.includes(status))
    return [`\`**Status**\` is not one of ${SPEC_STATUSES.join(", ")}`];
  if (status === "abandoned" || status === "superseded") return [];
  const problems: string[] = [];
  const linear = new RegExp(`^\\*\\*Linear\\*\\*:\\s*${upper}-(\\d+)\\b`, "m").exec(body)?.[1];
  if (linear && linear !== key)
    problems.push(
      `\`**Linear**: ${upper}-${linear}\` does not match the folder key ${upper}-${key}`,
    );
  if (status === "draft") return problems;
  problems.push(...specCheckClarified(text, parsed.prefix));
  const history =
    /^## Status history\b[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(body)?.[1] ?? "";
  if (!new RegExp(`→\\s*${status}\\b`, "i").test(history))
    problems.push(
      `\`## Status history\` has no "→ ${status.charAt(0).toUpperCase()}${status.slice(1)}" line`,
    );
  problems.push(...specCheckApproval(text));
  const tier = specTierOf(text);
  if (tier !== undefined && tier !== "trivial") problems.push(...specCheckCriteria(text));
  // ADR 0502: a small spec's design and tasks are sections of spec.md, not files.
  if (tier === "small") {
    const part = (name: string): string | undefined =>
      new RegExp(`^## ${name}\\b[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m").exec(body)?.[1];
    const design = part("Design");
    const steps = part("Tasks");
    if (specAtLeast(status, "planned")) {
      if (design === undefined)
        problems.push(`status ${status} needs a \`## Design\` section in a small spec`);
      else problems.push(...specCheckDesign(design, "spec.md ## Design", "###"));
    }
    if (specAtLeast(status, "tasked")) {
      if (steps === undefined)
        problems.push(`status ${status} needs a \`## Tasks\` section in a small spec`);
      else problems.push(...specCheckTraceTasks(steps, text, "spec.md ## Tasks", prefixes));
    }
    return problems;
  }
  const tiered = tier === "feature" || tier === "big";
  if (tiered && specAtLeast(status, "planned") && files.includes("plan.md"))
    problems.push(...specCheckDesign(plan, "plan.md", "##"));
  if (tiered && specAtLeast(status, "tasked") && files.includes("tasks.md"))
    problems.push(...specCheckTraceTasks(tasks, text, "tasks.md", prefixes));
  if (specAtLeast(status, "planned")) {
    if (!files.includes("plan.md")) problems.push(`status ${status} needs plan.md`);
    else problems.push(...specCheckPlan(plan, text));
  }
  if (specAtLeast(status, "tasked")) {
    if (!files.includes("tasks.md")) problems.push(`status ${status} needs tasks.md`);
    else problems.push(...specCheckTasks(tasks, { spec: text, plan, known, prefixes }));
  }
  const live = specParseTasks(tasks, prefixes).filter((t) => !t.struck);
  if (specAtLeast(status, "implementing") && !live.some((t) => t.done))
    problems.push(`status ${status}, but no task is ticked`);
  if (status === "done" && live.some((t) => !t.done))
    problems.push(
      `status done, but ${live
        .filter((t) => !t.done)
        .map((t) => t.id)
        .join(", ")} are unticked`,
    );
  return problems;
}
