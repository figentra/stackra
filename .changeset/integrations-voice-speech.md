---
"@stackra/integrations": minor
---

Voice channel (ADR 0376 decision 7, STA-1070): the `Speech` port (streaming speech to text and text to speech over raw
audio, `./contracts`) with `SpeechService`, which picks the speech Connection of the tenant's data region from
`region-map:<region>.providers.speech` (new `RegionMapSource` port and `RegionMapProviderDefaultsDriver`), honours
`zeroRetention`, and runs over a local `AudioDevice` (new port, `MemoryAudioDeviceDriver`). `VoiceMeter` writes
`usage.recorded` on `voice.minutes` per finished call and `speech.seconds` per stream (`VOICE_METERS`, `audioSeconds`).
`VoicePack` reads the pack's dialects, consent rule (strictest when missing) and its notice and question text;
`consentSteps` and `handoverSteps` build the call steps. New dependency: `@stackra/events`.
