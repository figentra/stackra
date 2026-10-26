/**
 * Stackra file contract:
 * Purpose: `KioskSurfaceProps`, the props of the native `KioskSurface` in `kiosk-surface.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0428 (decision 1); R3-SO-10; WCAG 2.2
 *          SC 2.2.1, 2.5.8 and 4.1.3.
 */
import type { KioskSurfaceContractProps } from "#contracts/types/kiosk-surface-contract-props.type";

/** Props of the native KioskSurface. */
export type KioskSurfaceProps = KioskSurfaceContractProps;
