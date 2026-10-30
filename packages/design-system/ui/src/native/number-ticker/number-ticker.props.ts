/**
 * Stackra file contract:
 * Purpose: `NumberTickerProps`, the props of the native `NumberTicker` in `number-ticker.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { NumberTickerContractProps } from "#contracts/types/number-ticker-contract-props.type";

/** Props of the native NumberTicker: the shared contract. */
export type NumberTickerProps = NumberTickerContractProps;
