---
"@stackra/container": patch
"@stackra/gen": patch
---

`@Replaces(Port)` now builds the replacement with its constructor dependencies: gen writes the replacement's
constructor tokens on each `replaces` row (`deps`), and the container passes them, as it does for any driver. Before,
the replacement was built with none and its injected fields were silently undefined.
