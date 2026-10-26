/**
 * Stackra file contract:
 * Purpose: `StatProps`, the props of the web `Stat` in `stat.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); owner decision 6 of STA-350 (thin wrappers).
 */
import type { StatContractProps } from "#contracts/types/stat-contract-props.type";

/** Props of the web Stat: the shared contract. */
export type StatProps = StatContractProps;
