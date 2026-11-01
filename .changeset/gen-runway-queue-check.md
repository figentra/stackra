---
"@stackra/gen": patch
---

A service's full run refuses `queue_unprovisioned` when an environment in its `runway.yaml` has no `queues.<name>`
entry for a queue its job actions run on, `default` aside (STA-1727). A member with no runway file or no environment
is not refused.

**Upgrading:** a product whose services run job actions on a named queue must add that queue under every environment
its `runway.yaml` declares, `environments.dev` and `environments.preview` included, before `stackra gen` passes on
this release:

```yaml
environments:
  dev:
    queues:
      invoices:
        visibilityTimeoutSeconds: 300
  preview:
    queues:
      invoices:
        visibilityTimeoutSeconds: 300
```
