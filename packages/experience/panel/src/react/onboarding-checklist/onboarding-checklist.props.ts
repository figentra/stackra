/**
 * Stackra file contract:
 * Purpose: `OnboardingChecklistProps`, the props of the console's onboarding checklist: the checklist as the viewer
 *          sees it (`@stackra/workflow`'s `checklistView` answer), and the handlers to open a step, mark it done and,
 *          when the viewer may customise it, hide or move an unlocked step.
 * Boundary: types only. The checklist is described by the shape it needs, which `ChecklistView` satisfies, so the panel
 *           does not depend on the workflow runtime. Labels are lang keys from the template (seed data).
 * Runtime: browser
 * Governing contract: ADR 0424 (decisions 1 and 2); owner RV-22 (editable templates, locked steps).
 */

/** Props of `OnboardingChecklist`. */
export interface OnboardingChecklistProps {
  /** The checklist as seen: its visible steps in order, how many are done, and whether all are. */
  readonly view: {
    readonly key: string;
    readonly steps: readonly {
      /** The step key. */
      readonly key: string;
      /** Its label, a lang key (`commerce::onboarding.add_products`). */
      readonly label: string;
      /** Its help, a lang key. */
      readonly description?: string | undefined;
      /** True when tenants may not hide or move it. */
      readonly locked: boolean;
      /** The route key that opens the step's screen. */
      readonly route?: string | undefined;
      /** Whether it is done for the viewer. */
      readonly done: boolean;
    }[];
    readonly done: number;
    readonly complete: boolean;
  };
  /** Called with a step's route key to open its screen. */
  readonly onOpen?: ((route: string) => void) | undefined;
  /** Called to mark a step done by hand; steps an event completes need no button. */
  readonly onComplete?: ((stepKey: string) => void) | undefined;
  /** Called to hide an unlocked step; no hide buttons without it. */
  readonly onHide?: ((stepKey: string) => void) | undefined;
  /** Called to move an unlocked step one place up (-1) or down (1); no move buttons without it. */
  readonly onMove?: ((stepKey: string, by: -1 | 1) => void) | undefined;
}
