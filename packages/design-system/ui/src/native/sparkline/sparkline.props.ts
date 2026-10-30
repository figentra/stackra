/**
 * Stackra file contract:
 * Purpose: `SparklineProps`, the props of the native `Sparkline`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { SparklineContractProps } from "#contracts/types/sparkline-contract-props.type";

/** Props of the native Sparkline. */
export type SparklineProps = SparklineContractProps & { readonly className?: string | undefined };
