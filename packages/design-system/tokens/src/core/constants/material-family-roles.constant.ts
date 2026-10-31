/**
 * Stackra file contract:
 * Purpose: `MATERIAL_FAMILY_ROLES`: the default level of every material role in each family. `front` puts the
 *          functional layer on glass (bars, sidebar, sheet, popovers, toasts, the action bar) and content on solid;
 *          `studio` keeps content and bars solid and puts glass only on what floats (popovers, menus, toasts, the
 *          action bar, the tab bar). Media controls are clear glass in both: media is media.
 * Boundary: data only; a theme changes a role with `materials.roles.<family>`, and `renderWebCss` writes the map.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (decision 1 as amended 2026-10-31); ADR 0501 (tokens v2, the materials block).
 */
import type { MaterialFamily } from "#contracts/enums/material-family.enum";
import type { MaterialRoleMap } from "#contracts/types/material-role-map.type";

/** Each family's role map. */
export const MATERIAL_FAMILY_ROLES: Readonly<Record<MaterialFamily, MaterialRoleMap>> =
  Object.freeze({
    front: {
      "nav-bar": "glass",
      "tab-bar": "glass",
      sidebar: "glass",
      toolbar: "glass",
      sheet: "glass",
      modal: "thick",
      popover: "glass",
      menu: "glass",
      tooltip: "thin",
      toast: "glass",
      command: "thick",
      card: "solid",
      "action-bar": "glass",
      fab: "glass",
      "segmented-track": "ultra-thin",
      "search-in-bar": "ultra-thin",
      "media-controls": "glass-clear",
    },
    studio: {
      // Solid at rest; a header over scrolled content asks for the glass of `nav-bar` with `data-scrolled`.
      "nav-bar": "solid",
      "tab-bar": "glass",
      sidebar: "solid",
      toolbar: "solid",
      sheet: "thick",
      modal: "thick",
      popover: "glass",
      menu: "glass",
      tooltip: "solid",
      toast: "glass",
      command: "thick",
      card: "solid",
      "action-bar": "glass",
      fab: "solid",
      "segmented-track": "solid",
      "search-in-bar": "solid",
      "media-controls": "glass-clear",
    },
  });
