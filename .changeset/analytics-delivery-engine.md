---
"@stackra/analytics": minor
---

Delivery engine in `AnalyticsClient`: batches at `flushAt` or after `flushIntervalMs`, `flush()`, bounded retry
with `backoffDelay` (`retryAttempts`, `retryBaseMs`, `retryMaxMs`, `bufferLimit`), per-visitor sampling
(`sampleRate`, per-event `sampleRates`), the page-hide beacon (`AnalyticsDriver.beacon`, implemented by the PostHog
driver with `navigator.sendBeacon`), and the optional `AnalyticsOfflineQueue` (`none`, `memory`, `storage` drivers;
`offlineDriver`, `offlineLimit`) that keeps batches whose retries are spent for the next launch. Drivers no longer
retry: the native PostHog driver's `send` resolves once its buffer holds the events.
