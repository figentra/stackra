---
"@stackra/gen": minor
---

An L3 or L4 action is no longer an agent tool by default. It becomes one only with `tool: true` and a `// reason:`
line, and gen fails with `tool_reason_missing` without the reason. The manifest records the reason on the tool and,
for a high-risk user action left off, a `toolOff` note. Owner security decision 2026-11-08.
