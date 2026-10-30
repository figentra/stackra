---
"@stackra/cli": minor
---

Add `stackra smoke --env <environment> [--only web,mobile,desktop] [--app <key> --ios <.app> --android <.apk>
--template-dir <dir>]` (STA-265): runs Runway's smoke step after a preview deploy, prints one line per result with its
problems and evidence, and exits 1 when any subject failed, so a promote job that needs it does not run. Runway's
reusable `runway-smoke.yml` runs it per runner: web on Linux, iOS on the Mac runner, Android on an emulator.
