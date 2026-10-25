/**
 * Stackra file contract:
 * Purpose: the props every runtime's `EnvironmentBanner` takes: the persistent strip that says which environment the
 *          viewer is in (a sandbox, staging), its detail and optional actions; nothing in production.
 * Boundary: types only. Whether the environment is production is the caller's fact (from the runway facts or the
 *           tenancy's sandbox flag), never a list of names here. The banner cannot be dismissed.
 * Runtime: isomorphic
 * Governing contract: ADR 0280 (decision 5 and open detail 4: persistent, not dismissible, none in production); ADR 0302
 *                     (decision 3).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `EnvironmentBanner`. */
export interface EnvironmentBannerContractProps {
  /** The environment's name as the viewer reads it (`Sandbox`, `Staging`); required, it is what is announced. */
  readonly environment: ReactNode;
  /** True in production, where the banner draws nothing. */
  readonly isProduction: boolean;
  /** What the environment means for the viewer (test payments, captured messages). */
  readonly description?: ReactNode | undefined;
  /** A next step, such as the publish-to-live button. */
  readonly actions?: ReactNode | undefined;
}
