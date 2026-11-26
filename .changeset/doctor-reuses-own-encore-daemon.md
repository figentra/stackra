---
"@stackra/cli": patch
---

`stackra dev` and `stackra doctor` no longer report Encore's dashboard port (9400) as in use when the listener is the
current user's own Encore daemon, which outlives `encore run` and is reused by the next one. The port counts as
reused only when the listener belongs to the current user, the user's daemon answers on its own socket
(`encored.sock` in the user cache folder) and the port serves the Encore development dashboard; anything else on
9400, another user's daemon included, and any other busy port still fail the check.
