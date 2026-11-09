---
"@stackra/cli": patch
"@stackra/gen": patch
---

`stackra lint` on a Fumadocs docs site now builds into its own `.lint-build/` folder and checks links there. Before, `lint` and `build` both ran `react-router build` into one `build/` folder. When turbo ran them side by side, one run emptied the folder the other was prerendering from. Pay's docs build then failed at random with "Cannot find module …/build/server/assets/use-on-change-….js".

How it works: the generated `react-router.config.ts` reads its build folder from `STACKRA_DOCS_BUILD_DIR` (default `build`), and `lint` sets it. Nothing to change in a product: the next gen writes the config.
