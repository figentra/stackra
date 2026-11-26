---
"@stackra/infra-testbed": patch
---

The testbed agent's seed refresh leaves out `.stackra/dev-secrets.json`, as the Mac's rsync does. The agent script's
`EXCLUDES` list had lost the entry that `TESTBED_DEFAULTS.rsyncExcludes` gained in STA-2679, so the two lists differed
and the `testbed-agent` excludes test failed.
