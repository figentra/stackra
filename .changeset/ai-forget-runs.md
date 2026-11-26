---
"@stackra/ai": patch
---

A subject's erasure reaches runs. `ConversationStore.forget` in the Postgres store now removes each erased conversation's runs, steps, tool calls and approvals first: a run references its conversation with no cascade, so `forget` failed on the foreign key as soon as the person had a run, which rolled the whole erasure back. New `RunStore.forget(principalId)` (both drivers) removes the runs that acted for the person in other conversations, as the actor or the person an agent acts for, up to two delegations deep. A legal hold still keeps what it covers. `PostgresConversationStoreDriver` takes the four run repositories too; the container injects them.
