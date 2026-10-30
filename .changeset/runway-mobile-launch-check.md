---
"@stackra/runway": minor
---

Add the smoke step after a preview deploy (STA-265): `smokePreview` checks every web surface at its canonical preview
host and every mobile app on each platform it has a build for, through the `SmokeDriver` port, and throws
`RunwaySmokeFailedError` with every result when one fails, so promotion is blocked. Drivers: `PlaywrightSmokeDriver`
(the page loads, renders its first screen, raises no console or page error and no critical axe violation; Playwright
and axe are optional peers from `catalog:e2e`), `MaestroSmokeDriver` (the mobile launch check) and the placeholder
`ElectronSmokeDriver` for desktop. The mobile launch check: `launchCheckJob` installs a Release simulator build on
the iOS simulator or the Android emulator and runs the template line's Maestro flows with the app's store id as
`APP_ID`, writing a JUnit report and screenshots to `.stackra/launch-check/<app>/<platform>/`; `runLaunchCheck` runs
that list and fails at the first failing flow. Defaults live in `LAUNCH_CHECK_DEFAULTS`. `easJsonOf` adds a
`simulator` build profile, shared by the launch check and the capture job.
