/**
 * Stackra file contract:
 * Purpose: `TamoSettings`, the whole Tamo switch of one workspace: the workspace level, then each screen, then each field on it.
 * Boundary: a type only; a dashboard edits it and the host passes it to `TamoProvider`; `resolveTamoEnabled` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0507 (Ask Tamo: AI slots in the design system); ADR 0504 (module UI kits).
 */
import type { TamoSetting } from "#react/tamo/tamo-setting.type";

/** The workspace's Tamo switch, by screen and field. */
export interface TamoSettings extends TamoSetting {
  /** Per screen key, with that screen's fields by name. */
  readonly screens?:
    | Readonly<
        Record<
          string,
          TamoSetting & { readonly fields?: Readonly<Record<string, TamoSetting>> | undefined }
        >
      >
    | undefined;
}
