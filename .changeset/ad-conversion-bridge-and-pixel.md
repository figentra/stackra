---
"@stackra/analytics": minor
"@stackra/integrations": minor
---

Ad conversions on both sides with one dedup id. `@stackra/analytics` adds the `ad-pixel` driver of `AnalyticsDriver`
(a destination gated by `marketing` that fires the tracked events `conversions` names on the new `AdPixel` port, with
the `ref` property's value as the event id), the `none` `AdPixel` driver, the `conversions` and `adPixelDriver`
settings, and `adClickIdOf` for the landing URL's ad click id. `@stackra/integrations` adds the conversion bridge:
`Conversion` (payload paths), `conversionOf` and `ConversionBridge`, which send an integration event such as
`order.placed` through `gateway.ads()` only when its consent grants `marketing`; `ConversionEvent` carries that consent
and `AdPlatformConnector` an optional `phoneFormat`.
