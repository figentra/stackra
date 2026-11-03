---
"@stackra/gen": minor
"@stackra/loyalty-kit": minor
"@stackra/achievements": minor
"@stackra/consent": minor
"@stackra/analytics": minor
"@stackra/clients": minor
"@stackra/ai": minor
"@stackra/access-log": minor
"@stackra/collaboration": minor
"@stackra/data-maintenance": minor
"@stackra/devices": minor
"@stackra/identity": minor
"@stackra/media": minor
"@stackra/privacy": minor
"@stackra/segments": minor
"@stackra/tenancy": minor
"@stackra/webhooks": minor
---

Every action and query route now sits under its API area. Gen prefixes each derived route with `/<area>`: the
action's or query's `area`, else the service's own `defineService({ area })`, else `app` (`PUT
/app/orders/:orderId/cancel`). Every manifest action entry records its `area`, so the committed manifests,
`openapi.json` and the SDKs move to the prefixed paths.

Gen also refuses, in its full pass (STA-340):

- `endpoint_collision`: two calls on one method and path once parameter names are erased (`GET /app/orders/:orderId`
  and `GET /app/orders/:id`). Until now `openapi.json` silently kept only one of them.
- `endpoint_versioned`: a `v<digits>` path segment (paths stay unversioned; API versions are dates).
- `endpoint_area_mismatch`: an `endpoint: { method, path }` override outside its area's prefix.
- `endpoint_method_mismatch`: a query not on `GET`, an action on `GET`, or a transition overridden away from `PUT`.
- `job_without_system_actor`: a `job` without the `system` or `job` actor.
- `cron_input_invalid`: a `job.cron.input` property the input schema does not have, a required one it omits, or a
  value of another JSON type.
- `intent_phrases_missing`: `intent: true` without a non-empty `actions.<key>.intents` list in a base-language
  catalogue.

The routes outside their area move under it: loyalty-kit's six overrides to `/app/loyalty/...`, the award
verification to `GET /public/awards/verify`, `CONSENT_SNAPSHOT_PATH` to `/public/consent/snapshots`,
`ANALYTICS_INGEST_PATH` to `/public/analytics/batches`, `DEVICE_ORDER.acknowledgedPath` to
`/app/devices/acknowledged` and `CLIENT_RESULT_ACTION.path` to `/app/runs/:runId/client-result`. The committed
`stackra.manifest.json` of every package with a route (access-log, collaboration, data-maintenance, devices, identity,
media, privacy, segments, tenancy, webhooks and the packages above) records each entry's `area` and its prefixed path.
