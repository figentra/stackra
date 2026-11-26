---
"@stackra/runway": patch
---

A Worker deploy prints its progress while it runs, with every secret masked. `CloudflareWorkersProviderDriver` writes
one line per phase to its new `log` (standard error by default): the build, each D1 migration, the upload, the version
id, the 0% stage, each smoke attempt with its answer, each rollout step with its percentage, each hold with its length
and end time, the rollback after a failed step and its result, and the lines of `verify` and `rollback`. Each
command's own output (wrangler's, turbo's) streams to the same log line by line, and every line, as well as a failed
command's message, has the member's secrets, its smoke bearers and the Cloudflare API tokens masked as `***`.
Before, `runProgram` buffered a command's output until it exited and the driver printed nothing, so a deploy was
silent for many minutes through the upload, the 0% smoke (up to ten minutes) and each five-minute rollout hold.

`runProgram` now runs a program with `spawn` and takes an optional `onLine` (on `CommandRunner`'s options): each
line the program prints, on standard output and standard error, is handed over as it is printed, and the standard
output is still answered whole. Without `onLine` nothing is streamed; a caller that prints the line masks it first.
