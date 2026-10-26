/**
 * Stackra file contract:
 * Purpose: `SurfaceProps`, the props of the web `Surface` in `surface.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0304; owner decision 6 of STA-350 (thin wrappers).
 */
import type { SurfaceRootProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { SurfaceContractProps } from "#contracts/types/surface-contract-props.type";

/**
 * HeroUI's props for a `div` surface: its own props plus the `div` attributes, as its generic signature spreads them.
 * HeroUI's exported `SurfaceProps` alone leaves the attributes out, so `id`, `role` and `ref` would be refused.
 */
type HeroSurfaceProps = SurfaceRootProps<"div"> &
  Omit<ComponentPropsWithRef<"div">, keyof SurfaceRootProps<"div">>;

/** Props of the web Surface: the shared contract plus HeroUI v3's own surface props, passed through unchanged. */
export type SurfaceProps = SurfaceContractProps &
  Omit<HeroSurfaceProps, keyof SurfaceContractProps>;
