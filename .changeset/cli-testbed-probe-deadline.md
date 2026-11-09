---
"@stackra/cli": patch
---

`stackra testbed run` gives every health and slot probe a 60 s deadline, as `testbed` does since figentra/testbed#22.
One box that keeps its SSH session open without answering (still booting, or a wedged Session Manager session) no
longer stalls a waiting run forever: that box counts as unhealthy for one look, and the next look tries it again.
