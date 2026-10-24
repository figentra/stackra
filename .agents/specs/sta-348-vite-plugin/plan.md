# Plan: `@stackra/vite-plugin` wave 3

**Spec**: `.agents/specs/sta-348-vite-plugin/spec.md`

1. **Preset plugins** (`src/core/functions/`): `corePlugins` wraps gen's `classComponents()` as a Vite plugin
   (skipped when the config already lists it), `generatedModulesPlugin` resolves `#stackra/*` to `.stackra/gen/`, and
   `serverOnlyPlugin` refuses `.server` specifiers in the client environment.
2. **Build plugins**: `pagesPlugin` (dev rewrite by longest prefix; build relocation with relative-depth fix),
   `manifestsPlugin` (serve and emit at the root), `budgetsPlugin` (gzipped chunk sizes), `prerenderPlugin`
   (`runnerImport` of the entry, `render(url, assets)` per route in `writeBundle`).
3. **Framework plugins**, loaded only where used: `renderPlugins` (React and Tailwind, or Workers, Tailwind and React
   Router), `pwaPlugin` (`vite-plugin-pwa` with `injectManifest`, no manifest, no registration), `sentryPlugin`.
4. **`viteConfig`** picks the target, checks pages, orders the plugins, sets server, define, base, output folder and
   input. **`stackra`** is the callable preset carrying `viteConfig`.
5. **Stand-in barrel and authored tool configs** until gen writes them (STA-339), as in earlier waves.
