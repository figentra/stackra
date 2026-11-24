---
"@stackra/cli": patch
---

`stackra new <package|service|seed-pack> --dry-run` writes nothing. Those three kinds took a path that never read the
flag, so the first command the scaffolding guide tells you to run created the member: `stackra new service demo --area
app --dry-run` wrote `services/demo`. A dry run now lists what the create would write (the member's files, the
package's LICENSE, and the workspace root a `--repo` folder without one would get), as the template kinds already did,
and `--over` lists only what it would write.
