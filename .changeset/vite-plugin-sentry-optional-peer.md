---
"@stackra/vite-plugin": minor
---

`@sentry/vite-plugin` is an optional peer of `@stackra/vite-plugin`, no longer a dependency. Only a member that uploads source maps (the `sourcemaps` option) loads it, but every consumer installed it and, with it, the Sentry CLI binary it downloads (FSL-1.1-MIT) even with Sentry off. Behaviour change for Sentry users: a member that uploads source maps now adds the package itself (`pnpm add -D @sentry/vite-plugin`); with the option on and the package missing, the build stops with one error that names it. With Sentry off nothing loads it, and nothing is installed.
