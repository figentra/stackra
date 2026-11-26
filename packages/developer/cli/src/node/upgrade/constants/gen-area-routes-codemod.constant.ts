/**
 * Stackra file contract:
 * Purpose: `GEN_AREA_ROUTES_CODEMOD`, 0.30.0: every derived action and query route sits under its API area (an
 *          anonymous-only call under `public`), and API keys reach the pipeline; gen regenerates the manifests,
 *          `openapi.json` and the clients, which `stackra upgrade` runs last anyway.
 * Boundary: data only; a note, since a raw URL a caller wrote by hand cannot be told from any other string.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145; changesets d5a7d0a, 96b5241 and 04d04e4.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Routes under their area. */
export const GEN_AREA_ROUTES_CODEMOD: UpgradeCodemod = {
  id: "gen-area-routes",
  version: "0.30.0",
  title: "Every derived action and query route is prefixed with its API area",
  note: "Gen prefixes each derived route with /<area>: the action's or query's area, else the service's defineService({ area }), else app (PUT /app/orders/:orderId/cancel). The committed manifests, openapi.json and the SDKs move to the prefixed paths when stackra gen runs. An action or query whose actors are exactly [ActorKind.Anonymous] defaults to the public area (/public/...), and API keys reach the pipeline as api_client actors through the regenerated adapters: commit the regenerated stackra.manifest.json and openapi.json. A generated client follows; a caller that wrote a raw URL by hand must add the area. Gen also refuses endpoint_collision, endpoint_versioned, endpoint_area_mismatch, endpoint_method_mismatch, job_without_system_actor, cron_input_invalid and intent_phrases_missing: fix each one it names.",
  source: "d5a7d0a, 96b5241, 04d04e4",
};
