---
"@stackra/flow-preset": patch
---

The `flow-gate` command no longer says GitHub CI runs no tests. Since STA-2705 the Quality Gate runs the unit tests of
the members a change affects, plus gen, tenancy, identity, actions and database; the whole suite, `test:int` and e2e
still run on the testbed through this gate.
