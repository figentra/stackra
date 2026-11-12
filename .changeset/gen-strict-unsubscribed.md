---
"@stackra/gen": patch
---

`client_event_unsubscribed` now refuses under `STACKRA_GEN_STRICT=1`. It fires for a listener of a contract-only producer's event that the producer's contract subscribes in no environment. Without strict it still warns, and gen writes.

A listener the producer never delivers to is a silent bug: Tamo's erasure delivery went quiet for weeks while this was only a warning. **On your bump:** a strict run fails until the producer's `runway.yaml` lists the member under `events.subscribers` and you bump its contract.
