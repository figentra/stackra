---
"@stackra/ui": minor
"@stackra/showcase": patch
---

Spinner, ProgressBar, ProgressCircle and RouteProgress draw the brand's dot loader on web and native (STA-2017,
figentra/brand rules §41), under the loaders' exception to ADR 0303 decision 6 (owner, 2026-11-02). Dots build the st
tile's floors 80 ms a step with the last or leading dot in the emphasis colour (`--core`, falling back to the accent
on the web; the tone's colour on native until STA-2015). Every prop, role, name and value stays. Reduced motion,
from the system or the provider, shows the dots at rest. The web Spinner's props are now the span's own (HeroUI's
`animation` and `render` are gone) and the native Spinner's the view's.
