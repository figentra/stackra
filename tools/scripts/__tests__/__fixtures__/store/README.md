# Store API fixtures

One answer per request, named by `fixtureName()` in `store-http.mjs`. They follow the documented App Store Connect,
Google Play and OAuth response shapes; the first live run re-records them with `pnpm store … --record` (credentials
and secret-looking fields scrubbed). A replay with no matching fixture fails the test.
