/**
 * Stackra file contract:
 * Purpose: `DemoIconName`, the names of the icons `DemoIcon` draws.
 * Boundary: a type only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0305 (rule 10).
 */
import type { DEMO_ICON_PATHS } from "./demo-icon-paths.constant";

/** The icons {@link DemoIcon} draws. */
export type DemoIconName = keyof typeof DEMO_ICON_PATHS;
