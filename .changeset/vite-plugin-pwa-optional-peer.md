---
"@stackra/vite-plugin": minor
---

`vite-plugin-pwa` is an optional peer of `@stackra/vite-plugin`, no longer a dependency. Only the PWA target loads it, but every consumer installed its workbox tree, and under pnpm's `trustPolicy: no-downgrade` that tree (`workbox-build` -> `@trickfilm400/rollup-plugin-off-main-thread@3.0.0-pre1`) refused to resolve, so a product could not install the plugin at all. A member that builds the PWA target now adds `vite-plugin-pwa` itself (`pnpm add -D vite-plugin-pwa`) and decides the trust question for that one package; the PWA target without it stops with one error that names the package to add. Every other member installs none of it.
