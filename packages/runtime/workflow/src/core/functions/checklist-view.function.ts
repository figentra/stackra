/**
 * Stackra file contract:
 * Purpose: `checklistView`, a checklist as one user sees it: the template's steps without the unlocked ones the scope
 *          hid, each locked step in its template place and the unlocked ones in the scope's order (the rest after, in
 *          template order), each marked done when its key is in `done`.
 * Boundary: pure. `done` holds the step keys done for the viewer: the scope's for scope steps and the viewer's own for
 *           user steps (`ChecklistService.view` reads both). A hidden or ordered key the template no longer has, or now
 *           locks, is ignored, so a new template version never breaks a scope's customization.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decisions 1 and 2).
 */
import type { ChecklistCustomization } from "#core/types/checklist-customization.type";
import type { ChecklistTemplate } from "#core/types/checklist-template.type";
import type { ChecklistView } from "#core/types/checklist-view.type";
import type { ChecklistViewStep } from "#core/types/checklist-view-step.type";

/**
 * The view of `template` under `customization` for a viewer who has done `done`.
 *
 * @example
 * checklistView(onboarding, { hidden: ["import_products"], order: [] }, new Set(["connect_payments"])).complete;
 */
export function checklistView(
  template: ChecklistTemplate,
  customization: ChecklistCustomization,
  done: ReadonlySet<string>,
): ChecklistView {
  const unlocked = template.steps.filter((step) => !step.locked);
  const hidden = new Set(customization.hidden);
  const ordered = [
    ...customization.order.flatMap((key) => unlocked.filter((step) => step.key === key)),
    ...unlocked.filter((step) => !customization.order.includes(step.key)),
  ].filter((step) => !hidden.has(step.key));
  const queue = [...ordered];
  const steps: ChecklistViewStep[] = [];
  for (const slot of template.steps) {
    const step = slot.locked ? slot : queue.shift();
    if (step !== undefined) steps.push(Object.freeze({ ...step, done: done.has(step.key) }));
  }
  const count = steps.filter((step) => step.done).length;
  return Object.freeze({
    key: template.key,
    steps: Object.freeze(steps),
    done: count,
    complete: count === steps.length,
  });
}
