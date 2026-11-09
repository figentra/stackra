# Quickstart: prove the relay end to end (SC-001, SC-004)

Runs on a testbed box (`ci-box run`), never on the Mac.

## Prerequisites

- Core's branch built, with `@stackra/outbox`, `@stackra/gen`, `@stackra/runway` and `@stackra/contracts` linked into
  figentra/pay and figentra/billing through a local pnpm overrides profile (ADR 0200: co-development only).
- pay's `runway.yaml` `dev` block lists billing as a subscriber of `payments.payment.captured.v1` and
  `payments.payment.failed.v1`, with a dev key pair; the private key reaches the job from the box's secret store by
  name, never as a file in the tree.
- billing pins the payments contract regenerated from that pay tree.

## Steps

1. Gen in pay: its manifest's `relay` section lists the dev key and billing.
2. Gen in billing (SC-004): passes with its payments listeners unchanged; `.stackra/gen/inbox.ts` and
   `.stackra/encore/billing/inbox.ts` exist; no `client_event_unsubscribed` warning.
3. Start both apps (`stackra dev`) on the box, with databases.
4. Capture a payment in pay through its action.
5. Expect: `outbox.deliveries` in pay gets one row for billing, then none; billing's `outbox.inbox` holds the event id
   once; billing's charge is settled once.
6. Replay: post the same signed request again; expect 204 and no second settlement.
7. Forgery: post it unsigned and with a key pay does not list; expect 401 and nothing recorded.

## Record

Cite the box run (box, commit, the outputs of steps 2, 5, 6 and 7) on the PR.
