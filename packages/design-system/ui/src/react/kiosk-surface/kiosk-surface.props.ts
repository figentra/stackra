/**
 * Stackra file contract:
 * Purpose: `KioskSurfaceProps`, the props of the web `KioskSurface` in `kiosk-surface.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0428 (decision 1); R3-SO-10; WCAG 2.2
 *          SC 1.4.6, 2.2.1, 2.5.8 and 4.1.3.
 */
import type { KioskSurfaceContractProps } from "#contracts/types/kiosk-surface-contract-props.type";

/** Props of the web KioskSurface. */
export type KioskSurfaceProps = KioskSurfaceContractProps;
