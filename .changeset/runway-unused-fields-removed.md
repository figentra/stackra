---
"@stackra/runway": minor
"@stackra/repo-checks": patch
---

The runway schemas drop the fields that no repository set and nothing read (STA-2028), so each of these keys now
fails `parseRunway` and `pnpm validate`:

- root runway: `resources.<name>.reason` (ADR 0493's reason rule is the workloads');
- app runway: `brands` (ADR 0335 puts brands in `stackra.config.ts`), `release.pwa` (ADR 0326 decision 6),
  `release.desktop.channels`, `release.desktop.signing` and `release.desktop.platforms` (ADR 0344 decision 7; they
  return with the desktop release job), `release.mobile.whiteLabel` (the root `mobile.<app>.whiteLabel` is the one
  read), and `release.mobile.profiles.<profile>.distribution`, `.developmentClient`, `.simulator`, `.androidApk` and
  `.autoIncrement` (`easJsonOf` sets them);
- app runway environments: `aliases`, `e2e`, `pwa`, `desktop.rollout` and `mobile.devClient`.

The app runway's `release.desktop`, `release.mobile`, each mobile profile and each environment's `desktop` and `mobile`
blocks are now strict. `brandsOf`, the `Brand` type and the `brands` entry of the runway facts are removed with
`brands`; nothing called them.

Kept, marked "Not read yet" in their description and in repo-checks' `RUNWAY_UNREAD_FIELDS`: the
`surfaces.ops.contributes` children (STA-2003), the app `health.path` and `health.expects` (Runway plan PR 13) and the
app environments' `desktop.devtools` (STA-2029).
