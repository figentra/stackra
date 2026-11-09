---
"@stackra/iam": minor
---

An anonymous call now runs the record's policy. A class that lists `ActorKind.Anonymous` lets a visitor past the
permission check, since a visitor holds no grant, but `ctx.authorize(record)` still calls the policy and any deny
wins. A policy that keys a record to its visitor refuses another visitor holding the record's id. Before, the
anonymous call skipped the policy too, so a record id alone read or changed the record.
