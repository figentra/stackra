---
"@stackra/gen": minor
---

Wire the round-14 features (STA-1385). A service that declares `@stackra/app` gets `.stackra/encore/<member>/http.ts`
(`emitEncoreHttp`): `answerHttp` answers an `OPTIONS` preflight with 204 and `corsHeaders(request, CorsConfig)` and
adds those headers to every other answer. Its wiring binds `OriginGuard` and `CsrfGuard` with the `app.cors` and
`app.csrf` config rows and the `HealthIndicator` driver of each declared package (database, cache, queue, realtime,
filesystem, search) with its config row (`SERVER_CONTRIBUTIONS`). `AgentRuntime` is bound with `AiMeter` and
`DiscoveryService`. An app's browser route table registers the declared manifests' `ui.resources` trees with
`registerResources` and lists `resourceLabelKeys`.
