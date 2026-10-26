/**
 * Stackra file contract:
 * Purpose: `checkAutomation`, the validator of an automation document or a plan: its shape (`AutomationDocument$`),
 *          then the registry: the trigger is a registered trigger block, each step's block a registered action, each
 *          awaited block a trigger that correlates, each reference a valid path that points backwards (`results.*` at
 *          an earlier step, `event.*` only in a waiting step, `item` only in a for-each step, whose list itself never
 *          names `item`), and each `when` a rules condition over the trigger's facts.
 * Boundary: pure over the process's `BUILDING_BLOCKS`; the trust boundary for stored automations and agent plans. It
 *           refuses with every problem it finds, by path, and never echoes a refused value. It runs nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3; enforcement: the validator refuses an unregistered building block); ADR
 *                     0153 (decision 1); ADR 0331 (decisions 1 and 10); ADR 0245 (decision 8); OS-232 (for-each).
 */
import { AUTOMATION_DOCUMENT_SCHEMA } from "#core/constants/automation-document-schema.constant";
import { BUILDING_BLOCKS } from "#core/constants/building-blocks.constant";
import { BlockKind } from "#core/enums/block-kind.enum";
import { AutomationInvalidError } from "#core/errors/automation-invalid.error";
import { refOf } from "#core/functions/ref-of.function";
import { triggerRules } from "#core/functions/trigger-rules.function";
import type { AutomationDocument } from "#core/types/automation-document.type";

/** A reference path. */
const REF = /^((input|results|event)(\.[A-Za-z0-9_]+)+|item(\.[A-Za-z0-9_]+)*)$/;

/**
 * The problem of reference `path`, given whether an occurrence is received (`hasEvent`), whether a for-each item is
 * current (`hasItem`) and the steps `done` before it; `undefined` when it is fine.
 */
function refProblem(
  path: string,
  hasEvent: boolean,
  done: ReadonlySet<string>,
  hasItem = false,
): string | undefined {
  if (!REF.test(path)) return "ref_invalid";
  const [root, name] = path.split(".");
  if (root === "event" && !hasEvent) return "ref_invalid";
  if (root === "item" && !hasItem) return "ref_invalid";
  if (root === "results" && !done.has(name ?? "")) return "ref_forward";
  return undefined;
}

/** Every reference path in `value`, with its JSON path under `at`. */
function refsIn(value: unknown, at: string): [string, string][] {
  const ref = refOf(value);
  if (ref !== undefined) return [[at, ref]];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, item]) => refsIn(item, `${at}.${key}`));
}

/**
 * `input` as a checked `AutomationDocument`.
 *
 * @throws AutomationInvalidError with one field error per refused place, by path.
 * @example
 * const document = checkAutomation(input.document); // before a draft, a dry run or a plan's run
 */
export function checkAutomation(input: unknown): AutomationDocument {
  const parsed = AUTOMATION_DOCUMENT_SCHEMA.safeParse(input);
  if (!parsed.success)
    throw AutomationInvalidError.create(
      {},
      {
        fieldErrors: Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join(".") || "(root)", "shape_invalid"]),
        ),
      },
    );
  const document = parsed.data;
  const errors: Record<string, string> = {};
  const trigger =
    document.trigger === undefined ? undefined : BUILDING_BLOCKS.get(document.trigger.block);
  if (document.trigger !== undefined && trigger === undefined)
    errors["trigger.block"] = "block_unknown";
  else if (trigger !== undefined && trigger.kind !== BlockKind.Trigger)
    errors["trigger.block"] = "block_not_trigger";
  const done = new Set<string>();
  document.steps.forEach((step, index) => {
    const at = `steps.${index}`;
    if (step.block !== undefined) {
      const block = BUILDING_BLOCKS.get(step.block);
      if (block === undefined) errors[`${at}.block`] = "block_unknown";
      else if (block.kind !== BlockKind.Action) errors[`${at}.block`] = "block_not_action";
    }
    if (step.waitFor !== undefined) {
      const awaited = BUILDING_BLOCKS.get(step.waitFor.block);
      if (awaited === undefined) errors[`${at}.waitFor.block`] = "block_unknown";
      else if (awaited.kind !== BlockKind.Trigger || awaited.correlate === undefined)
        errors[`${at}.waitFor.block`] = "block_not_waitable";
      const problem = refProblem(step.waitFor.correlate, false, done);
      if (problem !== undefined) errors[`${at}.waitFor.correlate`] = problem;
    }
    if (step.forEach !== undefined) {
      const problem = refProblem(step.forEach.items, step.waitFor !== undefined, done);
      if (problem !== undefined) errors[`${at}.forEach.items`] = problem;
    }
    for (const [path, ref] of refsIn(step.input, `${at}.input`)) {
      const problem = refProblem(ref, step.waitFor !== undefined, done, step.forEach !== undefined);
      if (problem !== undefined) errors[path] = problem;
    }
    if (step.when !== undefined) {
      if (trigger?.kind !== BlockKind.Trigger || trigger.facts === undefined)
        errors[`${at}.when`] = "when_without_facts";
      else if (Object.keys(triggerRules(trigger).problems(step.when)).length > 0)
        errors[`${at}.when`] = "when_invalid";
    }
    done.add(step.name);
  });
  if (Object.keys(errors).length > 0)
    throw AutomationInvalidError.create({}, { fieldErrors: errors });
  return document;
}
