# @stackra/realtime

## 0.1.0

### Minor Changes

- 396e384: Packages ship their `stackra.manifest.json` (listed in `files`), and the manifest gains a `config` section that gen
  reads for package config rows instead of the `*Config` name suffix. `stackra gen --check` refuses an unshipped manifest
  (`manifest_unshipped`). New memory drivers: `ConnectionStore` (integrations), `ScopeResolver` (scope),
  `RealtimeFanout` (realtime), `ErrorReporter` (errors), `SecretStore` (config) and `FlagProvider` (feature-flags).
  Generated file headers keep ` *` on continuation lines, so every generated header changes on the next regeneration.
- b2607b5: Add the `RealtimeFanout` port with the local and Valkey pub/sub drivers (`./node`), `RealtimeRelay` across instances,
  and the collaboration rooms of ADR 0346: `RealtimeRooms` (room tokens, stamped senders, caps, `room_limit_reached`),
  `REALTIME_ROOM_PATH`, and the `fanout` and `rooms` fields of `RealtimeConfig`.
- d72a734: Add `RealtimeHealthIndicatorDriver`, the `HealthIndicator` named `realtime` that publishes a zero member count for a probe room through the fan-out, and the `health` field of `RealtimeConfig` (probe timeout `PT2S`, `critical`) (STA-1379).
- 2787c1e: Add `@stackra/realtime`, which pushes live, data-free refreshes from a service to the sessions allowed to see them.
  
  On the server, `RealtimeHub` issues one-time subscribe tokens for verified sessions and holds the live connections.
  It checks the permission, the channel's principal or tenant and the realm (`channelRealms`) before every delivery, and
  it closes each connection when its token expires. `RealtimeBroadcaster` turns a committed integration event into a
  refresh on the channel derived from its broadcast audience: `tenant.{scopeId}.<module>`, or
  `principal.{principalId}.<module>` by default. The refresh carries only the wire name and the occurrence id, never the
  payload. The `RealtimeDriver` port (`./contracts`) has three drivers: `MemoryRealtimeDriver`, `SseRealtimeDriver`
  (a `text/event-stream` response with heartbeats) and `WebSocketRealtimeDriver` (sockets, with the SSE fallback).
  
  On the client, `RealtimeConnection` connects with a fresh token on every attempt and reconnects with capped, jittered
  backoff. When configured, it suspends in the background and resumes on foreground. It hands each refresh to the
  listeners of its event class. The `RealtimeTransport` port has two drivers: `WebsocketRealtimeTransportDriver`, which
  falls back to server-sent events, and `MemoryRealtimeTransportDriver`.
  
  The package also adds the `RealtimeConfig` configuration (`realtime`) with its shipped schema `RealtimeConfig$`,
  `RealtimeStatus`, `REALTIME_PATH`, `useRealtimeConnection` and `useSubscription` (`./react`), and `fakeRealtime`
  (`./testing`).
  
  `liveQueryRoutes` derives the routes of a live query's refresh (a query with `cache.invalidateOn`, every offline
  `replica:` query among them): one per invalidating event, on that event's module channel, under the query's own
  permission and audience, so the broadcaster carries the data-free refresh that makes `@stackra/query` refetch the
  query or refresh its replica by change cursor.
- 6d0152d: Rooms: `RealtimeRooms.stream(request)` serves a member over server-sent events when its socket cannot open; every
  `welcome` frame carries the membership's publish `key`, and `publishFrom(key, principalId, message)` relays a stream
  member's message (from `collaboration.room.publish`) on whichever instance holds it, through the new `room-publish`
  fanout message. The member cap counts every instance (`rooms.countAcrossInstances`, on by default) from the counts the
  instances fan out (`room-members`, and `members` on room frames). Venue relay: the `lan` `RealtimeLocalRelay` driver
  (`LanRealtimeLocalRelayDriver`, `./node`) hosts and discovers a local-network relay, keyed by the
  `REALTIME_LOCAL_RELAY_KEY` secret, with the `localRelay*` settings. A `RoomFrame` welcome now requires `key`.
- 150fa18: `maxBackoffSeconds: number` becomes `maxBackoff: Duration` (default `Duration.seconds(30)`, at least one second);
  the reconnect wait is the contracts `backoffDelay` with the same 1 s doubling and equal jitter. (stackra-223)

### Patch Changes

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
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [0abe92d]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [2787c1e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/events@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/transport@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
