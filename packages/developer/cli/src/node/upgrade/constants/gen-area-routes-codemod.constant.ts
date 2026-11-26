/**
 * Stackra file contract:
 * Purpose: `GEN_AREA_ROUTES_CODEMOD`, 0.30.0: every derived action and query route sits under its API area; gen
 *          regenerates the manifests, `openapi.json` and the clients, which `stackra upgrade` runs last anyway.
 * Boundary: data only; a note, since a raw URL a caller wrote by hand cannot be told from any other string.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145; changeset d5a7d0a.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Routes under their area. */
export const GEN_AREA_ROUTES_CODEMOD: UpgradeCodemod = {
  id: "gen-area-routes",
  version: "0.30.0",
  title: "Every derived action and query route is prefixed with its API area",
  note: "Gen prefixes each derived route with /<area>: the action's or query's area, else the service's defineService({ area }), else app (PUT /app/orders/:orderId/cancel). The committed manifests, openapi.json and the SDKs move to the prefixed paths when stackra gen runs. A generated client follows; a caller that wrote a raw URL by hand must add the area.",
  source: "d5a7d0a",
};
