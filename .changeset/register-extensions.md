---
"@stackra/gen": patch
---

Gen loads extensions: `#stackra/registrations` calls `registerExtensions` with each extension on its point's slot and
its order, and a service with an extension connects the slots at boot (`connectExtensions(container)`). Until now
nothing called `registerExtensions`, so every extension point's slots ran no extension.
