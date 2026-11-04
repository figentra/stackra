# Contract: producer configuration and manifest

## `runway.yaml` (producer), per environment

```yaml
environments:
  dev:
    events:
      signingKey: STACKRA_EVENTS_SIGNING_KEY # a secret name, never a value
      keys:
        - id: pay-dev-2026-11
          publicKey: "<base64url Ed25519 public key>"
      subscribers:
        - member: billing
          inbox: http://localhost:4012
          events:
            - payments.payment.captured.v1
            - payments.payment.failed.v1
```

`inbox` must be `https` outside `dev`. A service without an `events` block publishes nothing across apps.

## `stackra.manifest.json` (producer), written by gen

```json
{
  "relay": {
    "keys": { "dev": [{ "id": "pay-dev-2026-11", "publicKey": "…" }] },
    "subscribers": {
      "dev": [
        {
          "member": "billing",
          "events": ["payments.payment.captured.v1", "payments.payment.failed.v1"]
        }
      ]
    }
  }
}
```

Origins are not written. The contract package carries this section with the rest of the manifest.

## Gen diagnostics

- `client_event_remote_transport`: lifted.
- `client_event_unknown`: unchanged (an event the producer's contract does not declare).
- `client_event_unsubscribed` (warning): a consumer listens to a contract-only producer's event that the producer's
  manifest does not list for that consumer in any environment; names the consumer, the producer and the event.

## CLI (operator)

- `stackra outbox:relay-deliveries [--subscriber <member>] [--state pending|failing|dead]`
- `stackra outbox:relay-replay <dlv_id>`
