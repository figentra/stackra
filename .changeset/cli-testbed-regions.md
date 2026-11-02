---
"@stackra/cli": minor
---

`stackra testbed` works across an ordered list of enabled regions (`--regions a,b`, `STACKRA_TESTBED_REGIONS`, default `eu-west-1`; `--region r` narrows to one). `run` takes a free slot in the first region that has one, else raises the group in the first region with room, else waits (or exits 73 with `--no-wait`, 75 when no box is healthy), and every box is reached through its own region. `run --json` streams the job to stderr and prints one result line on stdout; `status` and `status --json` list every enabled region with its free, total and startable heavy and light slots and mark an unreachable one; `scale` and `unlock` take `--region`, defaulting to the region of the box they name.
