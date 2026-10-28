---
"@stackra/cache": minor
"@stackra/ai": minor
---

Erasure fan-out, cache and AI parts (data-layer gaps gov6 and ca16; STA-1444). `CacheKey.subject(id)` is the subject
tag (`~subject:<id>`) every entry holding a person's data carries, so an erasure drops them with
`forgetTag(CacheKey.subject(id))`. `ConversationStore.forget(principalId)` erases a principal's conversations and their
messages in the memory and Postgres drivers; a message under a legal hold stays with its conversation.
