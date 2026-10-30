# Contract: `tools-speech` (self-hosted speech-to-text)

Lane 8 (STA-1637) builds the image at `packages/infrastructure/infra-tools/images/speech` to this contract. OS
integrations (D06) writes the speech Connection driver against it. ADR 0492 decision 9, ADR 0376 decision 7.

## What it is

- faster-whisper `large-v3` (MIT) on one GPU in the regional tools stack (ECS, GPU capacity provider).
- **Recognition only.** It has no synthesis: a driver's `speak` refuses, and text-to-speech goes to a provider that
  has it (Azure AI Speech in GCC).
- **Zero retention.** Audio and text live in memory for the request only. Nothing is written to disk or logged
  except durations and status codes. A driver reports `retainsAudio: false`, so it may serve the health and
  privileged classes.
- Base URL: the `baseUrl` of the `speech` `ToolEndpoint` (category `speech`, provider `faster-whisper`), stored in the
  Connection config and used verbatim, with its scheme and port. A driver never builds a URL from a host.

## The rule for every tools-* image

Every tools-stack Connection (ocr, translate, speech, forecast, recommend, retrieval) stores the endpoint's full
`baseUrl` in its config and uses it as given. Today `toolsStackPlan` publishes `http://<tool>.<region>.tools.<project>.internal:<port>`,
which is plain HTTP inside the VPC: a private Cloud Map namespace, reachable only from the service subnets through
security groups. If the tools stack moves to TLS (ECS Service Connect with a private CA), only `baseUrl` changes and
no driver does.

## Auth

None at the HTTP layer. Like `tools-ocr`, it listens only on the private DNS namespace of the tools stack, and its
security group admits only the service subnets. There is no token and no secret name. If that ever changes, the token
will be a Connection credential reference, never an env value in the driver.

## Audio

| Field        | Accepted                                    | Notes                                                         |
| ------------ | ------------------------------------------- | ------------------------------------------------------------- |
| `encoding`   | `linear16` (16-bit LE PCM), `mulaw`, `alaw` | the `AudioEncoding` codes; no compressed codecs               |
| `sampleRate` | 8000 to 48000                               | resampled to 16000 inside                                     |
| `channels`   | 1 or 2                                      | 2 is downmixed                                                |
| length       | up to 300 s per stream or clip              | a longer stream is closed with `audio_too_long` after a final |

## `GET /health`

`200 {"status":"ok","model":"large-v3","device":"cuda"}` once the model is loaded, `503` before.

## `POST /v1/transcribe` (whole clip)

- Headers: `Content-Type: application/octet-stream`, `X-Audio-Encoding`, `X-Audio-Sample-Rate`,
  `X-Audio-Channels`, `X-Language` (BCP 47, e.g. `ar-AE`; the primary subtag is passed to Whisper, and the full tag
  is echoed back), optional `X-Hints` (URL-encoded, comma-separated words, passed as the initial prompt).
- Body: raw audio bytes in that format.
- `200`:

  ```json
  {
    "segments": [{ "text": "...", "start": 0.0, "end": 2.4, "confidence": 0.91 }],
    "text": "...",
    "language": "ar-AE",
    "durationSeconds": 2.4
  }
  ```

  `confidence` is `exp(avg_logprob)`, clamped to 0..1.

## `GET /v1/listen` (WebSocket, streaming)

This maps to `Speech.listen`.

1. Client → server, first text frame:
   `{"type":"start","language":"ar-AE","encoding":"linear16","sampleRate":16000,"channels":1,"hints":["..."]}`
2. Client → server: binary frames of raw audio in that format, of any size. 20 to 100 ms each is typical.
3. Client → server: `{"type":"end"}` when the audio is over. Closing the socket instead aborts, with no final flush.
4. Server → client, text frames:
   - `{"type":"transcript","text":"...","final":false,"language":"ar-AE"}`: an interim guess over the open
     utterance, sent at most every 500 ms.
   - `{"type":"transcript","text":"...","final":true,"language":"ar-AE","confidence":0.9}`: one per utterance.
     Utterances are cut by the built-in Silero VAD (silence ≥ 600 ms) and on `end`.
   - `{"type":"error","code":"<code>"}`, and then the server closes the socket.
5. After `end`, the server sends the last final and closes with code 1000.

Each stream is a `Transcript` sequence: `text`, `final`, `language`, `confidence?`.

## Errors

The HTTP status, or the WebSocket error code. The body is `{"code": "..."}` and never echoes audio or text.

| Code                   | HTTP | When                                                   |
| ---------------------- | ---- | ------------------------------------------------------ |
| `unsupported_format`   | 400  | encoding, rate or channels outside the table           |
| `unsupported_language` | 400  | Whisper has no model for the primary subtag            |
| `audio_too_long`       | 413  | over 300 s                                             |
| `not_ready`            | 503  | model still loading                                    |
| `busy`                 | 503  | the GPU queue is full; the driver retries with backoff |

## Metering

The caller meters `speech.seconds` from the bytes it sent (`audioSeconds`), as for every provider. The image
counts nothing.
