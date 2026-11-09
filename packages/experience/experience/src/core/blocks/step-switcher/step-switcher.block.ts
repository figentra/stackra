/**
 * Stackra file contract:
 * Purpose: `StepSwitcherBlock`, the document side of the landing's step switcher (`./react`'s `StepSwitcher`):
 *          its spoken name and its steps, each with the code it shows.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The code is shown as text, never run and never translated. The key is gen's
 *           `<member>.<snake(folder)>`, `experience.step_switcher`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { SwitcherStep } from "#core/types/switcher-step.type";

/** The step switcher a document places. */
export class StepSwitcherBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.stepSwitcher,
}) {
  /** The switcher's spoken name. */
  label!: LocalizedText;

  /** The steps, in order, each with its code. */
  steps!: SwitcherStep[];
}
