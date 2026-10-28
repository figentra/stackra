---
"@stackra/analytics": minor
"@stackra/logger": patch
---

Auto-capture: `useAutocapture(path)` (web) tracks `page.viewed` per path and `element.clicked` for `data-track`
elements, and `useScreenViews(screen)` (native) tracks `screen.viewed`, as `autocapturePageviews` and
`autocaptureClicks` switch them on. Breaking: `AnalyticsConfig.webVitals` and `sessionReplay` are removed;
`TelemetryConfig.vitals` and `replay` (@stackra/logger) are their one owner.
