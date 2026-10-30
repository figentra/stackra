/**
 * Stackra file contract:
 * Purpose: `AccountConnectionProps`, the props of the web `AccountConnection` in `account-connection.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { AccountConnectionContractProps } from "#contracts/types/account-connection-contract-props.type";
import type { CardProps } from "#react/card/card.props";

/**
 * Props of the web AccountConnection: the shared contract plus the Card's own props, passed through. The row is the
 * component's, so `children` is refused.
 */
export type AccountConnectionProps = AccountConnectionContractProps &
  Omit<CardProps, keyof AccountConnectionContractProps | "children">;
