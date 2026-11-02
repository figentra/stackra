---
"@stackra/cli": patch
---

`stackra testbed run` starts a box when the slot's group is at 0 and no box is healthy (desired 0 → 1), instead of
waiting for a box that never comes; with `--no-wait` it still exits 75 after raising it, so the next run finds the box.
