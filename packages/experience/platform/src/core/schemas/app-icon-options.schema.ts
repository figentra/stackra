/**
 * Stackra file contract:
 * Purpose: `AppIconOptions`, the alternate app icons a build carries, by name (one per brand, season or tenant).
 * Boundary: names only. The images come from the brand kit and gen writes them, with these names, into the app's
 *           config plugin entry; a name here with no image behind it fails on the device when the app switches to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); config-model.
 */
import { Field, registerSchemas, Schema } from "@stackra/validation";

import { APP_ICON_CONFIG_SCHEMA } from "#core/constants/app-icon-config-schema.constant";

/** The alternate app icons. */
export class AppIconOptions extends Schema {
  /** The alternate icons' PascalCase names; empty means the app has only its default icon. */
  // reason: an array of patterned strings; the package's own shipped schema says it
  @Field(APP_ICON_CONFIG_SCHEMA.shape.icons)
  icons: string[] = [];
}

registerSchemas([[AppIconOptions, APP_ICON_CONFIG_SCHEMA]]);
