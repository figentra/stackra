/**
 * Stackra file contract:
 * Purpose: `QuestionnaireCardProps`, the props of the native `QuestionnaireCard`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { QuestionnaireCardContractProps } from "#contracts/types/questionnaire-card-contract-props.type";

/** Props of the native QuestionnaireCard. */
export type QuestionnaireCardProps = QuestionnaireCardContractProps & {
  /** Styles the card. */
  readonly className?: string | undefined;
};
