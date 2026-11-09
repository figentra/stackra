---
"@stackra/ai": minor
---

`AgentRuntime.stream`'s `uiStream` is safe to send to a person: with a guardrail layer bound (`AgentStream.guarded`), it holds the text and reasoning deltas and sends the reply's guarded text once the run settles, before `finish`; tool and approval chunks still stream at once, and a blocked answer is one `error` chunk naming `guardrail_blocked`. `textStream` stays unguarded.
