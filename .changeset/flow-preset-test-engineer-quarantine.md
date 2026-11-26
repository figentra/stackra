---
"@stackra/flow-preset": patch
---

The test-engineer agent describes the flaky-test quarantine (`tools/scripts/test-markers.yaml`: a gate with its reason,
a quarantine with its Linear issue, reason and an `until` date at most 30 days out; never commit `.only`) and the
shared-box rules (port 0, `mkdtemp` folders, a stand-in for host-wide resources, `// shared-box: <reason>` for a
deliberate exception).
