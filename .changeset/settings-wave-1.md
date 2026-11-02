---
"@stackra/settings": minor
---

A new `@stackra/settings/react` entry. `SettingsForm` renders a generated settings page on the web, at parity with
the native form: a switch for each on-or-off key, a text field for each number or text key, a locked key read-only,
and each change written through the container's `SettingsReader` at the page's level, with a refused change restored
and its reason shown and announced. `useSetting(page, name)` reads and writes one key the same way, for a host that
lays out its own screen. The showcase lists the form under Blocks.
