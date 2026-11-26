/**
 * Stackra file contract:
 * Purpose: `CapabilityMatrixBlock`, the document side of the landing's capability matrix (`./react`'s
 *          `CapabilityMatrix`): subjects by capability (carriers by rates, labels, pickups, tracking…), each cell yes,
 *          no, coming or a short note.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The key is gen's `<member>.<snake(folder)>`, `experience.capability_matrix`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { CapabilityColumn } from "#core/types/capability-column.type";
import type { CapabilityRow } from "#core/types/capability-row.type";
import type { CapabilityStateLabels } from "#core/types/capability-state-labels.type";

/** The capability matrix a document places. */
export class CapabilityMatrixBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.capabilityMatrix,
}) {
  /** The table's caption, read first by a screen reader. */
  label!: LocalizedText;

  /** The capabilities, left to right. */
  columns!: CapabilityColumn[];

  /** The subjects, top to bottom. */
  rows!: CapabilityRow[];

  /** The heading of the subjects' column ("Carrier"). */
  rowHeader!: LocalizedText;

  /** The words beside each state's icon. */
  stateLabels!: CapabilityStateLabels;
}
