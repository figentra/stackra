/**
 * Stackra file contract:
 * Purpose: `ChipProps`, the props of the web `Chip` in `chip.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0304 (decision 3); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ChipRootProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { ChipContractProps } from "#contracts/types/chip-contract-props.type";

/** HeroUI's props for a `span` chip: its own props plus the `span` attributes, as its generic signature spreads them. */
type HeroChipProps = ChipRootProps<"span"> &
  Omit<ComponentPropsWithRef<"span">, keyof ChipRootProps<"span">>;

/**
 * Props of the web Chip: the shared contract plus HeroUI v3's own chip props, passed through unchanged. HeroUI's
 * `color` is the contract's `tone`; `onClick` is refused because a clickable `span` has no keyboard access.
 */
export type ChipProps = ChipContractProps &
  Omit<HeroChipProps, keyof ChipContractProps | "color" | "onClick">;
