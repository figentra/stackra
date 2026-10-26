/**
 * Stackra file contract:
 * Purpose: `BadgeAnchorProps`: props of the native Badge.Anchor.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decisions 3 and 5: parity,
 *          adapted form); ADR 0165 (HeroUI Native on native); ADR 0304; ADR 0060; owner decision 6 of STA-350 (thin
 *          wrappers).
 */
import type { ViewProps } from "react-native";
import type { BadgeAnchorContractProps } from "#contracts/types/badge-anchor-contract-props.type";

/** Props of the native Badge.Anchor: the shared contract plus React Native's view props. */
export type BadgeAnchorProps = BadgeAnchorContractProps & Omit<ViewProps, "children">;
