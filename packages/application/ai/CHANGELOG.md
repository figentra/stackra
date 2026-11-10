# @stackra/ai

## 0.33.0

### Minor Changes

- df6f577: The ChatSurface draws a `data-tamo-artifact` part by default: an `AttachmentCard` of the file Tamo made (its name with the kind as extension, and its size). Opening or downloading it calls the host's new `onOpenArtifact` or `onDownloadArtifact` with the artifact's id and version; the part never carries a link. `TamoArtifactPart` gains an optional `bytes`, and its `kind` is the file extension.
- 54aa1e7: `AgentRuntime.stream`'s `uiStream` is safe to send to a person: with a guardrail layer bound (`AgentStream.guarded`), it holds the text and reasoning deltas and sends the reply's guarded text once the run settles, before `finish`; tool and approval chunks still stream at once, and a blocked answer is one `error` chunk naming `guardrail_blocked`. `textStream` stays unguarded.

### Patch Changes

- Updated dependencies [54aa1e7]
- Updated dependencies [93d63bb]
- Updated dependencies [ad4e5bf]
- Updated dependencies [03da426]
- Updated dependencies [246594d]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [22493bf]
  - @stackra/actions@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/tenancy@0.33.0
  - @stackra/model@0.33.0
  - @stackra/database@0.33.0
  - @stackra/ui@0.33.0
  - @stackra/search@0.33.0
  - @stackra/outbox@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/container@0.33.0
  - @stackra/events@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [54db249]
  - @stackra/ui@0.32.0
  - @stackra/actions@0.32.0
  - @stackra/database@0.32.0
  - @stackra/search@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/outbox@0.32.0
  - @stackra/tenancy@0.32.0
  - @stackra/model@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/events@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Minor Changes

- 7179d1a: `ChatFormPart` (`@stackra/panel/react`) draws an action's form in a chat turn from its JSON Schema input: one field per key, drawn as a screen draws it, prefilled by the assistant, with uploads through the host's `upload`, and sent as the person's answer. `useZodFormHandle` (`@stackra/ui/form`) runs a form over a zod schema with no class, and `useSchemaFormHandle` now builds on it. `TamoFormPart` gains `id`, which the host answers with the sent values, as a question's.

### Patch Changes

- Updated dependencies [298af71]
- Updated dependencies [6473cf1]
- Updated dependencies [7179d1a]
  - @stackra/actions@0.31.0
  - @stackra/database@0.31.0
  - @stackra/ui@0.31.0
  - @stackra/search@0.31.0
  - @stackra/outbox@0.31.0
  - @stackra/tenancy@0.31.0
  - @stackra/model@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/events@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 097aad2: `AgentRuntime.stream` also answers `uiStream`, the run as AI SDK v7 UI message chunks (message id: the run id), so a host can serve the answer live to `useChat`. A tool call parked on an approval arrives as a `tool-approval-request` chunk with the run's approval id; `textStream` and `reply` are unchanged.
- 85cd1b5: `@stackra/ui` adds `ApprovalCard`, a tool call that waits for a person: what will run, its input and risk, and Approve
  and Deny until it is answered or expires. `@stackra/ai`'s `ChatSurface` now also draws a turn's AI SDK UI message parts
  in order (text, reasoning, sources, a tool approval as an `ApprovalCard`, and each `data-tamo-<kind>` part through the
  host's `renderers`), and `./contracts` adds the typed data of Tamo's chat parts (`TamoPartKind`, `TamoPartData`).
- 8d5fcb9: `@stackra/ai`'s `ChatSurface` now draws Tamo's data parts out of the box with @stackra/ui: a table as a `Table`
  (numbers written by column type), a chart as the `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `DonutChart` or
  `ScatterChart` of its kind, KPIs as a `Kpi` or a `KpiGroup` of `Stat`s (number, money, percent, duration), a question
  as a `QuestionnaireCard` that answers through the new `onAnswer` prop (read-only without it), and suggestions as
  `PromptSuggestions` that send through `onSend`. A host's `renderers` entry still wins for its kind; `widget_ref`,
  `form`, `report` and `artifact` keep no default. `./react` exports `defaultChatPartRenderers` and `ChatPartOptions`,
  which every part renderer now gets as its third argument.
- d5a7d0a: **Breaking route change.** Every action and query route now sits under its API area. Gen prefixes each derived route with `/<area>`: the
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
  
  The routes outside their area move under it: loyalty-kit's five overrides to `/app/loyalty/...`, the award
  verification to `GET /public/awards/verify`, `CONSENT_SNAPSHOT_PATH` to `/public/consent/snapshots`,
  `ANALYTICS_INGEST_PATH` to `/public/analytics/batches`, `DEVICE_ORDER.acknowledgedPath` to
  `/app/devices/acknowledged` and `CLIENT_RESULT_ACTION.path` to `/app/runs/:runId/client-result`. The committed
  `stackra.manifest.json` of every package with a route (access-log, collaboration, data-maintenance, devices, identity,
  media, privacy, segments, tenancy, webhooks and the packages above) records each entry's `area` and its prefixed path.
  
  The identity lock accepts this move once: an endpoint whose new route is exactly `/<its own area>` plus the locked
  path, with the same method, keeps its identity without `@Renamed`. A move to another area, a method change, or a route
  that already started with an area moving again is still refused with `identity_changed`.
  
  What a product does on its bump: run `stackra gen` and commit the regenerated `stackra.manifest.json` and
  `openapi.json` of each member. Nothing else; no `@Renamed`. Clients regenerate from the new manifests, so a caller
  pinned to an old path (none before launch) would need the prefixed one.

### Patch Changes

- a03990d: The committed manifests catch up with the source: `stackra gen` regenerated them from current main, so
  `stackra gen --check` is clean before the release.
- Updated dependencies [418e195]
- Updated dependencies [6005425]
- Updated dependencies [0394e56]
- Updated dependencies [85cd1b5]
- Updated dependencies [96b5241]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [0394e56]
- Updated dependencies [d8d78f0]
- Updated dependencies [7b5a381]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [8c17109]
- Updated dependencies [98a8940]
- Updated dependencies [82dccb3]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [a3a3190]
- Updated dependencies [265a3ee]
- Updated dependencies [d5a7d0a]
- Updated dependencies [15dba8d]
- Updated dependencies [d3c8b27]
- Updated dependencies [d3c8b27]
  - @stackra/actions@0.30.0
  - @stackra/ui@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/database@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/outbox@0.30.0
  - @stackra/container@0.30.0
  - @stackra/search@0.30.0
  - @stackra/tenancy@0.30.0
  - @stackra/model@0.30.0
  - @stackra/events@0.30.0
  - @stackra/validation@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [3361957]
- Updated dependencies [b4b6422]
- Updated dependencies [09b2c41]
- Updated dependencies [11a19a7]
- Updated dependencies [45afd22]
  - @stackra/actions@0.29.0
  - @stackra/container@0.29.0
  - @stackra/database@0.29.0
  - @stackra/tenancy@0.29.0
  - @stackra/search@0.29.0
  - @stackra/outbox@0.29.0
  - @stackra/model@0.29.0
  - @stackra/ui@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/events@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [2b6f88c]
  - @stackra/actions@0.28.0
  - @stackra/database@0.28.0
  - @stackra/search@0.28.0
  - @stackra/outbox@0.28.0
  - @stackra/tenancy@0.28.0
  - @stackra/model@0.28.0
  - @stackra/ui@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/events@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [4a4d817]
- Updated dependencies [8a70552]
  - @stackra/database@0.27.0
  - @stackra/outbox@0.27.0
  - @stackra/search@0.27.0
  - @stackra/tenancy@0.27.0
  - @stackra/actions@0.27.0
  - @stackra/model@0.27.0
  - @stackra/ui@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/events@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [93e358e]
- Updated dependencies [9b02a7c]
- Updated dependencies [9cee75d]
- Updated dependencies [a9f21b6]
- Updated dependencies [e5da198]
  - @stackra/database@0.26.0
  - @stackra/tenancy@0.26.0
  - @stackra/actions@0.26.0
  - @stackra/ui@0.26.0
  - @stackra/search@0.26.0
  - @stackra/outbox@0.26.0
  - @stackra/model@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/events@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [1d7bbc1]
- Updated dependencies [dc9da69]
- Updated dependencies [8f8ddcf]
- Updated dependencies [3942ab1]
  - @stackra/database@0.25.0
  - @stackra/tenancy@0.25.0
  - @stackra/search@0.25.0
  - @stackra/outbox@0.25.0
  - @stackra/actions@0.25.0
  - @stackra/model@0.25.0
  - @stackra/ui@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/events@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- Updated dependencies [35959f6]
- Updated dependencies [f86dec4]
- Updated dependencies [2df7162]
  - @stackra/actions@0.24.0
  - @stackra/database@0.24.0
  - @stackra/search@0.24.0
  - @stackra/outbox@0.24.0
  - @stackra/tenancy@0.24.0
  - @stackra/model@0.24.0
  - @stackra/ui@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/events@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [12f4836]
- Updated dependencies [82238da]
- Updated dependencies [1083617]
- Updated dependencies [6edeee4]
- Updated dependencies [12f4836]
- Updated dependencies [a2c8821]
- Updated dependencies [a42a80c]
- Updated dependencies [12f4836]
- Updated dependencies [dee48f0]
  - @stackra/database@0.23.0
  - @stackra/tenancy@0.23.0
  - @stackra/ui@0.23.0
  - @stackra/search@0.23.0
  - @stackra/actions@0.23.0
  - @stackra/outbox@0.23.0
  - @stackra/model@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/events@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [b394912]
- Updated dependencies [786848c]
- Updated dependencies [acbee14]
- Updated dependencies [227dd7a]
- Updated dependencies [940e198]
  - @stackra/database@0.22.0
  - @stackra/actions@0.22.0
  - @stackra/tenancy@0.22.0
  - @stackra/events@0.22.0
  - @stackra/search@0.22.0
  - @stackra/outbox@0.22.0
  - @stackra/model@0.22.0
  - @stackra/ui@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- ba0edde: Migration `ai.0006_rename_run_policies` renames the tenant policies of `ai.run_steps` and `ai.run_approvals` to
  `pol_run_steps_tenant_id` and `pol_run_approvals_tenant_id`. 0005 renamed the tables but a rename keeps policy names,
  so a host's generated tenant-isolation test read each table as missing its policy and carrying a second permissive one.
  The rename keeps each predicate in place, so no table is ever without its policy.
- Updated dependencies [a785356]
- Updated dependencies [d3e77e0]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/model@0.21.0
  - @stackra/database@0.21.0
  - @stackra/search@0.21.0
  - @stackra/tenancy@0.21.0
  - @stackra/actions@0.21.0
  - @stackra/ui@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/events@0.21.0
  - @stackra/outbox@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [667a3b5]
- Updated dependencies [80d121b]
- Updated dependencies [a7b7e58]
- Updated dependencies [19a9222]
- Updated dependencies [667a3b5]
  - @stackra/actions@0.20.0
  - @stackra/database@0.20.0
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/search@0.20.0
  - @stackra/outbox@0.20.0
  - @stackra/tenancy@0.20.0
  - @stackra/model@0.20.0
  - @stackra/ui@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/events@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [58a8fa5]
- Updated dependencies [b59aa22]
- Updated dependencies [bac874e]
- Updated dependencies [12f25aa]
- Updated dependencies [e5f5432]
- Updated dependencies [40fda23]
- Updated dependencies [0da5f7a]
- Updated dependencies [0921f1f]
- Updated dependencies [dd9427a]
- Updated dependencies [4a23af8]
- Updated dependencies [fc845f4]
- Updated dependencies [9063bb3]
- Updated dependencies [0e0de4f]
- Updated dependencies [0e0de4f]
- Updated dependencies [e5ac3d0]
- Updated dependencies [d76d1ed]
- Updated dependencies [d2b3d22]
- Updated dependencies [eafb209]
- Updated dependencies [d22e767]
- Updated dependencies [e283a31]
- Updated dependencies [27f2b3f]
- Updated dependencies [15d8a1b]
- Updated dependencies [bc5a0ab]
- Updated dependencies [6ec440d]
  - @stackra/contracts@0.19.0
  - @stackra/actions@0.19.0
  - @stackra/tenancy@0.19.0
  - @stackra/database@0.19.0
  - @stackra/search@0.19.0
  - @stackra/model@0.19.0
  - @stackra/ui@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/events@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/outbox@0.19.0

## 0.18.1

### Patch Changes

- @stackra/tenancy@0.18.1
  - @stackra/actions@0.18.1
  - @stackra/database@0.18.1
  - @stackra/model@0.18.1
  - @stackra/search@0.18.1
  - @stackra/ui@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/events@0.18.1
  - @stackra/validation@0.18.1
  - @stackra/outbox@0.18.1

## 0.18.0

### Patch Changes

- @stackra/tenancy@0.18.0
  - @stackra/actions@0.18.0
  - @stackra/database@0.18.0
  - @stackra/model@0.18.0
  - @stackra/search@0.18.0
  - @stackra/ui@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/events@0.18.0
  - @stackra/validation@0.18.0
  - @stackra/outbox@0.18.0

## 0.17.2

### Patch Changes

- @stackra/tenancy@0.17.2
  - @stackra/actions@0.17.2
  - @stackra/database@0.17.2
  - @stackra/model@0.17.2
  - @stackra/search@0.17.2
  - @stackra/ui@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/events@0.17.2
  - @stackra/validation@0.17.2
  - @stackra/outbox@0.17.2

## 0.17.1

### Patch Changes

- @stackra/search@0.17.1
  - @stackra/actions@0.17.1
  - @stackra/database@0.17.1
  - @stackra/model@0.17.1
  - @stackra/ui@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/events@0.17.1
  - @stackra/validation@0.17.1
  - @stackra/outbox@0.17.1
  - @stackra/tenancy@0.17.1

## 0.17.0

### Patch Changes

- @stackra/actions@0.17.0
  - @stackra/database@0.17.0
  - @stackra/model@0.17.0
  - @stackra/search@0.17.0
  - @stackra/ui@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/events@0.17.0
  - @stackra/validation@0.17.0
  - @stackra/outbox@0.17.0
  - @stackra/tenancy@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/search@0.16.0
  - @stackra/actions@0.16.0
  - @stackra/database@0.16.0
  - @stackra/model@0.16.0
  - @stackra/ui@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/events@0.16.0
  - @stackra/outbox@0.16.0
  - @stackra/tenancy@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [0b0cf51]
  - @stackra/outbox@0.15.0
  - @stackra/search@0.15.0
  - @stackra/tenancy@0.15.0
  - @stackra/actions@0.15.0
  - @stackra/database@0.15.0
  - @stackra/model@0.15.0
  - @stackra/ui@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/events@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/search@0.14.4
  - @stackra/actions@0.14.4
  - @stackra/database@0.14.4
  - @stackra/model@0.14.4
  - @stackra/ui@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/events@0.14.4
  - @stackra/validation@0.14.4
  - @stackra/outbox@0.14.4
  - @stackra/tenancy@0.14.4

## 0.14.3

### Patch Changes

- @stackra/actions@0.14.3
  - @stackra/database@0.14.3
  - @stackra/model@0.14.3
  - @stackra/search@0.14.3
  - @stackra/ui@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/events@0.14.3
  - @stackra/validation@0.14.3
  - @stackra/outbox@0.14.3
  - @stackra/tenancy@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/actions@0.14.2
  - @stackra/database@0.14.2
  - @stackra/model@0.14.2
  - @stackra/search@0.14.2
  - @stackra/ui@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/events@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/outbox@0.14.2
  - @stackra/tenancy@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/actions@0.14.1
  - @stackra/database@0.14.1
  - @stackra/model@0.14.1
  - @stackra/search@0.14.1
  - @stackra/ui@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/events@0.14.1
  - @stackra/validation@0.14.1
  - @stackra/outbox@0.14.1
  - @stackra/tenancy@0.14.1

## 0.14.0

### Patch Changes

- @stackra/actions@0.14.0
  - @stackra/database@0.14.0
  - @stackra/model@0.14.0
  - @stackra/search@0.14.0
  - @stackra/ui@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/events@0.14.0
  - @stackra/validation@0.14.0
  - @stackra/outbox@0.14.0
  - @stackra/tenancy@0.14.0

## 0.13.0

### Patch Changes

- @stackra/actions@0.13.0
  - @stackra/database@0.13.0
  - @stackra/model@0.13.0
  - @stackra/search@0.13.0
  - @stackra/ui@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/events@0.13.0
  - @stackra/validation@0.13.0
  - @stackra/outbox@0.13.0
  - @stackra/tenancy@0.13.0

## 0.12.0

### Patch Changes

- @stackra/actions@0.12.0
  - @stackra/database@0.12.0
  - @stackra/model@0.12.0
  - @stackra/search@0.12.0
  - @stackra/ui@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/events@0.12.0
  - @stackra/validation@0.12.0
  - @stackra/outbox@0.12.0
  - @stackra/tenancy@0.12.0

## 0.11.1

### Patch Changes

- @stackra/actions@0.11.1
  - @stackra/database@0.11.1
  - @stackra/model@0.11.1
  - @stackra/search@0.11.1
  - @stackra/ui@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/events@0.11.1
  - @stackra/validation@0.11.1
  - @stackra/outbox@0.11.1
  - @stackra/tenancy@0.11.1

## 0.11.0

### Patch Changes

- @stackra/actions@0.11.0
  - @stackra/database@0.11.0
  - @stackra/model@0.11.0
  - @stackra/search@0.11.0
  - @stackra/ui@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/events@0.11.0
  - @stackra/validation@0.11.0
  - @stackra/outbox@0.11.0
  - @stackra/tenancy@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
- Updated dependencies [aea9b1d]
  - @stackra/contracts@0.10.0
  - @stackra/database@0.10.0
  - @stackra/actions@0.10.0
  - @stackra/search@0.10.0
  - @stackra/ui@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/outbox@0.10.0
  - @stackra/tenancy@0.10.0
  - @stackra/model@0.10.0
  - @stackra/container@0.10.0
  - @stackra/events@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [b174a17]
- Updated dependencies [681d01a]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/model@0.9.0
  - @stackra/ui@0.9.0
  - @stackra/container@0.9.0
  - @stackra/database@0.9.0
  - @stackra/tenancy@0.9.0
  - @stackra/actions@0.9.0
  - @stackra/search@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/events@0.9.0
  - @stackra/outbox@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [928dcc0]
- Updated dependencies [7dd35b3]
  - @stackra/database@0.8.0
  - @stackra/container@0.8.0
  - @stackra/search@0.8.0
  - @stackra/outbox@0.8.0
  - @stackra/tenancy@0.8.0
  - @stackra/actions@0.8.0
  - @stackra/model@0.8.0
  - @stackra/ui@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/events@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/tenancy@0.7.1
  - @stackra/actions@0.7.1
  - @stackra/database@0.7.1
  - @stackra/model@0.7.1
  - @stackra/search@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/events@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/outbox@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
  - @stackra/tenancy@0.7.0
  - @stackra/search@0.7.0
  - @stackra/actions@0.7.0
  - @stackra/database@0.7.0
  - @stackra/model@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/events@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/outbox@0.7.0

## 0.6.1

### Patch Changes

- @stackra/actions@0.6.1
  - @stackra/database@0.6.1
  - @stackra/model@0.6.1
  - @stackra/search@0.6.1
  - @stackra/ui@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/events@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/outbox@0.6.1
  - @stackra/tenancy@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [fb29d41]
- Updated dependencies [c64a55d]
- Updated dependencies [d53d9d3]
- Updated dependencies [712fb89]
  - @stackra/database@0.6.0
  - @stackra/tenancy@0.6.0
  - @stackra/ui@0.6.0
  - @stackra/search@0.6.0
  - @stackra/outbox@0.6.0
  - @stackra/actions@0.6.0
  - @stackra/model@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/events@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fa949b]
  - @stackra/database@0.5.1
  - @stackra/search@0.5.1
  - @stackra/outbox@0.5.1
  - @stackra/tenancy@0.5.1
  - @stackra/actions@0.5.1
  - @stackra/model@0.5.1
  - @stackra/ui@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/events@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [104d9f4]
- Updated dependencies [d7f72d3]
  - @stackra/tenancy@0.5.0
  - @stackra/ui@0.5.0
  - @stackra/search@0.5.0
  - @stackra/actions@0.5.0
  - @stackra/database@0.5.0
  - @stackra/model@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/events@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/outbox@0.5.0

## 0.4.0

### Patch Changes

- 3ce01cf: A package's entity list is a committed generated contract, `src/node/entities.gen.ts`, written by `stackra gen` and kept
  fresh by `stackra gen --check` (ADR 0294 R10 and ADR 0295, amended 2026-11-01, STA-1874). Each package's `./node` now
  ships its `<KEY>_ENTITIES` inlined in the build instead of importing the gitignored `.stackra/gen/entities/` at runtime,
  which failed: the 0.3.0 builds of these packages carry that broken import until this release. `stackra validate`
  expects the re-export from `#node/entities.gen`, and the doc standard skips `*.gen.ts` files.
- 36dbd49: Each package with models of its own exports `<MEMBER>_ENTITIES` from `./node`, which a hosting service's generated
  `registrations.ts` imports to register the package's entities; without it the service failed with TS2305 (STA-1793). `stackra validate --repository` refuses a package with own
  models whose stand-in `./node` barrel misses it.
- Updated dependencies [71b37fc]
- Updated dependencies [7a94bc4]
- Updated dependencies [a7eaed4]
- Updated dependencies [a8c358a]
- Updated dependencies [0b660e0]
- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [4f3f1ed]
- Updated dependencies [e070131]
- Updated dependencies [d675b4d]
- Updated dependencies [3df2c07]
- Updated dependencies [2d6bb63]
- Updated dependencies [7dc74f6]
- Updated dependencies [d9bf3c2]
- Updated dependencies [90f55b1]
- Updated dependencies [1c22c33]
- Updated dependencies [688cf0c]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [79dc807]
- Updated dependencies [5fc0db7]
- Updated dependencies [2bbc0e8]
- Updated dependencies [1856ee0]
- Updated dependencies [dedaa81]
- Updated dependencies [a7eaed4]
- Updated dependencies [149ca06]
- Updated dependencies [1567384]
  - @stackra/actions@0.4.0
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/database@0.4.0
  - @stackra/tenancy@0.4.0
  - @stackra/container@0.4.0
  - @stackra/events@0.4.0
  - @stackra/outbox@0.4.0
  - @stackra/search@0.4.0
  - @stackra/model@0.4.0
  - @stackra/ui@0.4.0
  - @stackra/errors@0.4.0

## 0.3.0

### Minor Changes

- ccc0b0f: Add client tools and page context (STA-1631, ADR 0490): `ToolSource.Client`, the `ClientToolKind` and `SurfaceKind`
  enums, the `ClientToolRow`, `ClientToolTable`, `SurfaceDescriptor`, `ClientToolPart`, `ClientToolAnswer` and
  `ClientToolPending` types, `offerClientTools`, and `PromptCall.surface`, `clientTools` and `onClientTool`.
  `AgentRuntime` parks a run on a client tool call (`RunStatus.WaitingClientTool`, `RunRecord.clientPending`), emits the
  part to that surface only, and resumes through `resolveClientTool` or, after 30 seconds, `expireClientTool`
  (`client_unavailable`); a repeat answer is refused with `ClientToolNotPendingError`. Adds the `ClientResultInput`
  schema with `CLIENT_RESULT_ACTION` (`PUT /runs/:runId/client-result`), the `PageContext` schema and
  `resolvePageContext` (unreadable ids dropped, `Facts` lookups, field allow-list, token budget), and migration 0004
  (three nullable park columns on `ai.runs`; the run status and tool call outcome checks widened). The `ToolSource`
  docblock now states the ADR 0360 decision 4 default.
- 23e556c: `routeModel` refuses a `credential` request and `allowFields` lets no `credential` field through (STA-1677, ADR 0494).
- 4a6abd7: Add the module UI kits (ADR 0504): each module's `./react` entry ships its domain blocks on `@stackra/ui`, every word
  and value in props. `@stackra/ai/react`: `ChatSurface`. `@stackra/pricing/react`: `PricingTable`.
  `@stackra/payments/react`: `Cart` and `Checkout`. `@stackra/identity/react`: `SignIn`. `@stackra/experience/react`:
  `FeatureSection` and `CtaSection`.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [a60f4e9]
- Updated dependencies [c4443b5]
- Updated dependencies [b00096a]
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [be75ede]
- Updated dependencies [895a526]
- Updated dependencies [a60f4e9]
- Updated dependencies [a60f4e9]
- Updated dependencies [9ed272a]
- Updated dependencies [6484453]
  - @stackra/actions@0.3.0
  - @stackra/database@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/events@0.3.0
  - @stackra/model@0.3.0
  - @stackra/outbox@0.3.0
  - @stackra/search@0.3.0
  - @stackra/tenancy@0.3.0
  - @stackra/ui@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [cfdcdf8]
- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [9085c41]
  - @stackra/actions@0.2.0
  - @stackra/database@0.2.0
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/search@0.2.0
  - @stackra/outbox@0.2.0
  - @stackra/tenancy@0.2.0
  - @stackra/model@0.2.0
  - @stackra/container@0.2.0
  - @stackra/events@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- 534d7c8: Add the approval-mode resolver of ADR 0360 (`resolveApproval` with `ApprovalMode`, in the fixed order IAM,
  entitlement, environment, floor, organisation, user, level; the floor is data), the model router by task, region and
  data class with tenant overrides and disclosed fallbacks (`routeModel`, `resolveModel`, `ModelProviderDriver`), the
  field allow-list per data class and redaction rules (`allowFields`, `redact`), the token budget check (`checkBudget`),
  layered guardrails (`runGuardrails`, `Guardrail`), eval runs (`runEvals`) and the intent router (`routeIntent`).
- d1b23c1: Guardrail drivers and the AI token meter. `PatternGuardrailDriver` (configured patterns), `PiiGuardrailDriver`
  (contact rules plus the Market's national ID formats from `@stackra/validation`), `InjectionGuardrailDriver` (weighted
  signals and hidden characters) and `ClassifierGuardrailDriver` (a routed model picking a label) each block, redact or
  flag per stage (`GuardrailEffect`, `GuardrailStages`). `GuardrailVerdict` may now carry the redacted `text` and
  `flags`, and `runGuardrails` hands redacted text to the next layer and answers `{ pass: true, text, flags }`.
  `AiMeter` writes `usage.recorded` on `ai.tokens` (input and output, model as subject, scope) for entitlement limits.
- 20f3fe9: One vector store (ADR 0465): the `Embedding` model is removed from `./node` and migration `ai.0002_drop_embeddings`
  drops `ai.embeddings`. Embeddings live in `search.vector_items` behind `VectorIndex` of `@stackra/search`, which
  `retrieve()` already reads; conversation memory stores through it with its ids, embedder and content hash as metadata.
  Nothing wrote the old table, so no data moves.
- 2787c1e: Add `@stackra/ai`: the `Prompt`, `Skill` and `Facts<M>` kind bases of a module's `ai/` group, the `ToolSource` and
  `Approval` vocabulary of the generated MCP tool table with `approvalFor`, and `decide()`, a typed choice, score or
  yes/no answer from a model on AI SDK core.
- 0e90fc3: Add the `PageReader` port (`./contracts`, ADR 0450): `read(url)` returns a `PageReading` (final URL, status, title,
  language, readable text and schema.org `ProductHint`s) or a `PageReadRefusal` code. Add `MemoryPageReaderDriver` and
  `HttpPageReaderDriver`, which checks every URL and redirect with `checkEgress` and takes its limits as a
  `PageReaderPolicy` from settings, plus the shared `parsePage` (STA-904, STA-929).
- b966fad: Add the AI action permission matrix to `resolveApproval` (`ActionPermission`, record scope, the market pack's floor,
  the `propose` outcome and the approver rule), the agent runtime (`Agent`, `Promptable`, `AgentRuntime`: prompt, stream,
  queue, resume) over the new `./contracts` ports with memory stores, and the `./node` entry with the ADR 0100 tables,
  the Postgres conversation and run stores and the tenant-key encryption cast `ScopeKeyCast`.
- 975a6c1: Add `retrieve(query, { index, embedder, topK, scope })`, the retrieval helper for `Facts`: it embeds the query with the
  `Embedder`, asks the `VectorIndex` (both from `@stackra/search/contracts`) for the top-k hits in the caller's scope and
  returns `RetrievedPassage`s (text, source id, score) for `provide` to return. Adds the `@stackra/search` dependency.
- 900e79d: Add the three integration events of ADR 0100 decision 11, `ApprovalRequested`, `ApprovalResolved` and `RunCompleted`,
  recorded by `PostgresRunStoreDriver` on the row that changes so the outbox writes them with it (STA-781).
- 6006b78: Bind encrypted fields to the scope that owns the row (gap gov8, ADR 0476). `HasEncryptedFields({ scope: "tenantId" },
  ...fields)` seals and opens each value in `<model key>.<field>@<scope id>`, so a value copied into another scope's row
  does not open; the subscriber and `EncryptedFieldsResealService` read the id from the row and refuse a row without
  one, and `encryptedScopeOf` reads the option. `@stackra/ai`'s `Message` now declares its content this way, and
  `ScopeKeyCast` is removed from `@stackra/ai/node`: `PostgresConversationStoreDriver` takes only its two repositories.
- acff14a: Erasure fan-out, cache and AI parts (data-layer gaps gov6 and ca16; STA-1444). `CacheKey.subject(id)` is the subject
  tag (`~subject:<id>`) every entry holding a person's data carries, so an erasure drops them with
  `forgetTag(CacheKey.subject(id))`. `ConversationStore.forget(principalId)` erases a principal's conversations and their
  messages in the memory and Postgres drivers; a message under a legal hold stays with its conversation.
- d19a3d5: `AgentRuntime` meters and guards every run (STA-1385). It now takes `AiMeter` and `DiscoveryService` (two new
  constructor parameters, bound by gen): each settled loop's token usage goes to `AiMeter.tokens` (run id, routed model,
  scope, actor), and every bound `GuardrailLayer` checks the prompt before it is stored and the final answer before it is
  stored. A redaction is what the conversation keeps; a block throws the new `GuardrailBlockedError` (403,
  `guardrail_blocked`), failing the run when it is the answer.

### Patch Changes

- 13ad6ab: The guardrail options (`PatternGuardrailOptions`, `PiiGuardrailOptions`, `InjectionGuardrailOptions`,
  `ClassifierGuardrailOptions`) are now abstract classes exported at runtime, so each guardrail driver's constructor
  takes a class token that `stackra gen` and the container accept. Object literals still fit; a host that lets the
  container build a layer binds the options token with `useValue`.
- b8fc2ac: `Message.content` carries `@Classified(DataClassification.Personal)`, so export, erasure and the logs treat the sealed
  prompt and response text as personal data and gen's `encrypted_field_unclassified` check passes (ADR 0465, ADR 0476).
- 5ae13cb: Each `AppendOnly` model's table now has a migration that calls `t.appendOnly()` (STA-1413), so `UPDATE` is revoked
  from `public` and the service's role and gen's `append_only_not_revoked` check passes: access-log 0003 (access and
  audit log entries), ai 0003 (`messages`, `steps`, `tool_calls`) and loyalty-kit 0003 (`ledger_entries`, exported as
  `AppendOnlyLedgerEntriesMigration`).
- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- a681685: `AssuranceLevel` and `MeterKind` have one home, `@stackra/contracts` (STA-1383). Breaking: `@stackra/actions/contracts`
  and `@stackra/identity` no longer export `AssuranceLevel`, and `@stackra/actions` and `@stackra/model` no longer export
  `MeterKind`; import both from `@stackra/contracts`. The codes are unchanged.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [0abe92d]
- Updated dependencies [bc4acfc]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [6bb8ea8]
- Updated dependencies [e45cd73]
- Updated dependencies [6006b78]
- Updated dependencies [483eb44]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [9841d79]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [c580aa4]
- Updated dependencies [7e60fa9]
- Updated dependencies [b62c042]
- Updated dependencies [e52a367]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [a31d463]
- Updated dependencies [38bebd1]
- Updated dependencies [cf64395]
- Updated dependencies [158f6cf]
- Updated dependencies [1f34fad]
- Updated dependencies [d72a734]
- Updated dependencies [68ae29e]
- Updated dependencies [20f3fe9]
- Updated dependencies [2787c1e]
- Updated dependencies [3649655]
- Updated dependencies [9811f8d]
- Updated dependencies [be97996]
- Updated dependencies [41035cc]
- Updated dependencies [7055e31]
- Updated dependencies [1e3e28d]
- Updated dependencies [7e60fa9]
- Updated dependencies [d156aa8]
- Updated dependencies [02a7917]
- Updated dependencies [fdf4b94]
- Updated dependencies [3671963]
- Updated dependencies [640ae17]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [c3ff8a7]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [a45c902]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/model@0.1.0
  - @stackra/search@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/tenancy@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
