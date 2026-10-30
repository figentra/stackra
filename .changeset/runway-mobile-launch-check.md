---
"@stackra/runway": minor
---

Add the mobile launch check (STA-265): `launchCheckJob` defines the commands that install a Release simulator build
on the iOS simulator (the capture job's Mac runner) or the Android emulator (a Linux runner with KVM) and run the
template line's Maestro flows with the app's store id as `APP_ID`, writing a JUnit report and screenshots to
`.stackra/launch-check/<app>/<platform>/`; `runLaunchCheck` runs that list and fails at the first failing flow, so a
promotion that needs it is blocked. Defaults live in `LAUNCH_CHECK_DEFAULTS`. `easJsonOf` adds a `simulator` build
profile (the preview build for the iOS simulator and as an APK), shared by the launch check and the capture job.
