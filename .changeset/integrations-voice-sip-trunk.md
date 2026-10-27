---
"@stackra/integrations": minor
---

Voice: SIP trunk driver (ADR 0376 decision 7, RV-51, STA-1092), certification pending (owner D3). `./node` adds
`SipVoiceGateway`, a `VoiceGateway` over a carrier SIP trunk that places calls (INVITE with MD5 or SHA-256 digest
auth, ring timeout by CANCEL), receives them, registers when configured, and runs each call's instructions itself
(`say` and `listen` through `SpeechService` over the new `RtpAudioDeviceDriver`, `play` from a WAV in the call's G.711
codec, `handover` by REFER, `hang_up` by BYE), posting statuses and metering answered minutes through `VoiceMeter`.
Configuration is `SipTrunkOptions`; credentials are the secret names in `SIP_TRUNK_SECRETS`. Recording is refused
(501 `recording_unsupported`); UDP only.
