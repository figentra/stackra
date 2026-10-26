/**
 * Stackra file contract:
 * Purpose: `ChainOfThoughtProps`, props of the web ChainOfThought: the shared contract plus HeroUI Pro's own
 *          disclosure props, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChainOfThoughtRootProps as HeroChainOfThoughtRootProps } from "@heroui-pro/react/chain-of-thought";

import type { ChainOfThoughtContractProps } from "#contracts/types/chain-of-thought-contract-props.type";

/** Props of the web ChainOfThought: the shared contract plus HeroUI Pro's own disclosure props, passed through. */
export type ChainOfThoughtProps = ChainOfThoughtContractProps &
  Omit<HeroChainOfThoughtRootProps, keyof ChainOfThoughtContractProps>;
