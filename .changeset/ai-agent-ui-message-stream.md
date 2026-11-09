---
"@stackra/ai": minor
---

`AgentRuntime.stream` also answers `uiStream`, the run as AI SDK v7 UI message chunks (message id: the run id), so a host can serve the answer live to `useChat`. A tool call parked on an approval arrives as a `tool-approval-request` chunk with the run's approval id; `textStream` and `reply` are unchanged.
