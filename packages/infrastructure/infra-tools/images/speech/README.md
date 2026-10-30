# tools-speech

<!--
Stackra file contract:
Purpose: the reader guide of the `tools-speech` image: what it serves and where its HTTP contract lives.
Boundary: documentation only; the contract file wins on any difference.
Runtime: none
Governing contract: ADR 0492 (decision 9); ADR 0376 (decision 7); ADR 0444.
-->

faster-whisper `large-v3` on one GPU, recognition only, zero retention. The HTTP and WebSocket contract (`GET /health`,
`POST /v1/transcribe`, `GET /v1/listen`, audio formats, error codes) is
[`.agents/specs/sta-1629-ai-everywhere/contracts/tools-speech.md`](../../../../../.agents/specs/sta-1629-ai-everywhere/contracts/tools-speech.md);
OS integrations writes the speech Connection driver against it, so this image never changes an endpoint, field, header
or code without that file changing first.

- `server.py` is the aiohttp server; `audio.py` decodes G.711, downmixes and resamples to 16 kHz with numpy.
- Utterances in a stream are cut by faster-whisper's built-in Silero VAD at 600 ms of silence.
- Off by default in `TOOLS_CATALOGUE` (`speech`, `enabled: false`, `gpu: true`); a region turns it on in the root runway
  (`providers.tools.tools.speech.enabled: true`) when audio must not leave it.
- Tests: `__tests__/test_server.py` with a stub engine (needs aiohttp, numpy and pytest, not the model).
- A failure inside the engine is a bare 500 (or a 1011 close) that the contract does not list; it carries no content.
