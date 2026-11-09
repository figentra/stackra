---
"@stackra/actions": minor
"@stackra/contracts": minor
"@stackra/settings": minor
---

The rate-limit step can read a scope's limits from settings, so an operator lowers them without a deploy. When a
`RateLimitCapSource` (new port in `@stackra/contracts`) is bound, each area bucket number and each default action
bucket is the lower of its own and the scope's cap; a cap never raises a limit, and a failed read fails the call.
`@stackra/settings` ships the driver, `SettingsRateLimitCapSourceDriver`, over the new `RateLimitSettings` group
(`rate_limit.<area>PerMinute`, `<area>Burst`, `actionPerScope`, `actionPerAddress`; `null` caps nothing). With no
source bound, nothing changes.
