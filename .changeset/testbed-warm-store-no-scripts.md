---
"@stackra/infra-testbed": patch
---

The image warms its pnpm store with `pnpm fetch --ignore-scripts`, and the validate phase's offline check runs the same
way. Filling the store needs no lifecycle scripts, and the build instance has no job tokens, so a licence-gated
postinstall (uniwind-pro) failed the build.

The box agent's per-job fetch now works the same way: it fills the store without scripts, from a copy of the lockfile,
workspace file, pnpmfile and `.npmrc` instead of the job's workspace. Run in the workspace, it left a `node_modules`
that made the container skip its install, and it loaded the job's `mise.toml` on the host. The job container gets
`CI=true`, as CI does, so the repository's mise environment no longer sets `NODE_ENV=development` for its tests.
Each job's own install still runs the scripts, with its tokens.

The job image adds Playwright's Firefox and WebKit beside Chromium, a virtual display (`xvfb-run`) with Electron's
runtime libraries for desktop end-to-end tests, and ffmpeg. The image's check opens a page in all three browsers and
starts a headed Chromium on the display.
