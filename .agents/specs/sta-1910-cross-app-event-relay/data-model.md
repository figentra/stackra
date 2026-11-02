# Data model: cross-app event relay (STA-1910)

## `outbox.deliveries` (producer, new, migration 0003 of `@stackra/outbox`)

| Column         | Type        | Rule                                                        |
| -------------- | ----------- | ----------------------------------------------------------- |
| `id`           | public id   | `dlv_` prefix                                               |
| `event_id`     | public id   | the envelope id (`evt_`)                                    |
| `subscriber`   | text        | the consumer's member key, from the subscriber source       |
| `type`         | text        | the wire name with version (`payments.payment.captured.v1`) |
| `envelope`     | jsonb       | the cross-app envelope as sent, without `producer`          |
| `attempts`     | int         | starts at 0                                                 |
| `available_at` | timestamptz | the next attempt                                            |
| `last_error`   | jsonb       | code and status of the last failure, never a body           |
| `dead_at`      | timestamptz | set when dead-lettered                                      |
| `created_at`   | timestamptz |                                                             |

- Unique (`event_id`, `subscriber`, `type`): a relay retry and an older version under the same id stay distinct and
  single.
- Index `available_at` where `dead_at` is null.
- States: pending (`dead_at` null, `attempts` 0), failing (`attempts` > 0), dead (`dead_at` set); a delivered row is
  deleted. Replay sets `dead_at` null, `attempts` 0, `available_at` now.
- No RLS: the producer's operational table, as `outbox.messages`.

## `outbox.inbox` (consumer, existing, unchanged)

`event_id` primary key and `received_at`; claimed in the handling transaction (`PostgresInboxDriver.claim`).

## Cross-app envelope (wire)

`EventEnvelope` of `@stackra/outbox/contracts` (`id`, `type`, `occurredAt`, `scope`, `meta`, `data`) plus:

- `envelopeVersion`: `1`.
- `producer`: never sent; the inbox sets it from the verifying contract's service before handling.

## Manifest `relay` section (producer's `stackra.manifest.json`)

- `keys`: per environment, a list of `{ id, publicKey }` (base64url Ed25519 public keys); current first, next second.
- `subscribers`: per environment, a list of `{ member, events }` (wire names); no origins.

## Runway `events` block (producer's `runway.yaml`, per environment)

- `signingKey`: the secret name (default `STACKRA_EVENTS_SIGNING_KEY`).
- `keys`: `{ id, publicKey }` list.
- `subscribers`: `{ member, inbox, events }` list; `inbox` is the consumer's origin, `https` outside `dev`.
