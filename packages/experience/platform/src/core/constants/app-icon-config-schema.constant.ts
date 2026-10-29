/**
 * Stackra file contract:
 * Purpose: `APP_ICON_CONFIG_SCHEMA`, the shipped `AppIconConfig$`: the names of the alternate app icons this build
 *          carries.
 * Boundary: data shape only; the defaults are in `AppIconOptions`. A name is PascalCase, as the native project keys it.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); config-model.
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's AppIconOptions into #stackra/schemas; replace with STA-339.
/** The shipped `AppIconConfig$`. */
export const APP_ICON_CONFIG_SCHEMA = z.object({
  icons: z.array(z.string().regex(/^[A-Z][A-Za-z0-9]*$/)),
});
