# Stackra file contract:
# Purpose: the speech HTTP server of the per-region tools stack, to the contract in
#          `.agents/specs/sta-1629-ai-everywhere/contracts/tools-speech.md`: `GET /health`, `POST /v1/transcribe` (a
#          whole clip) and the WebSocket `GET /v1/listen` (interim and final transcripts, utterances cut by faster-whisper's
#          built-in Silero VAD at 600 ms of silence), all on faster-whisper `large-v3`. Recognition only.
# Boundary: zero retention. Audio and text live in memory for the request or stream and nowhere else: nothing is written
#           to disk, no body or frame is logged, and the only log line is the method, path, status and duration. Errors
#           are `{"code": ...}` bodies (or `{"type": "error", "code": ...}` frames) that never echo audio or text. No
#           auth: it listens only inside the region's private namespace, as tools-ocr does. One GPU job runs at a time;
#           more than SPEECH_MAX_QUEUE waiting is `busy`. A failure inside the engine is left to aiohttp's bare 500 (or a
#           1011 close), which the contract does not list and which carries no content.
# Runtime: python 3.12 in the tools-speech image (aiohttp, numpy, faster-whisper)
# Governing contract: contracts/tools-speech.md of the sta-1629 spec; ADR 0492 (decisions 8 and 9); ADR 0376 (decision
#                     7); ADR 0444.
import asyncio
import json
import logging
import math
import os
import time
from urllib.parse import unquote

import numpy as np
from aiohttp import WSMsgType, web

import audio

MODEL = "large-v3"
PORT = int(os.environ.get("PORT", "8080"))
MAX_QUEUE = int(os.environ.get("SPEECH_MAX_QUEUE", "4"))
SILENCE_SECONDS = 0.6
INTERIM_SECONDS = 0.5
CUT_PADDING_SECONDS = 0.2
MAX_HINT_CHARACTERS = 500
# The languages of Whisper large-v3 by primary subtag.
LANGUAGES = frozenset(
    "af am ar as az ba be bg bn bo br bs ca cs cy da de el en es et eu fa fi fo fr gl gu ha haw he hi hr ht hu hy id "
    "is it ja jw ka kk km kn ko la lb ln lo lt lv mg mi mk ml mn mr ms mt my ne nl nn no oc pa pl ps pt ro ru sa sd "
    "si sk sl sn so sq sr su sv sw ta te tg th tk tl tr tt uk ur uz vi yi yo zh yue".split()
)

log = logging.getLogger("speech")


class Refused(Exception):
    """A contract error: `code` is the body's code and `status` the HTTP status."""

    def __init__(self, code, status):
        super().__init__(code)
        self.code = code
        self.status = status


def refuse_format():
    return Refused("unsupported_format", 400)


def primary_language(tag):
    """The Whisper language of a BCP 47 `tag`, or `unsupported_language`."""
    primary = (tag or "").split("-")[0].lower()
    if primary not in LANGUAGES:
        raise Refused("unsupported_language", 400)
    return primary


def prompt_of(hints):
    """The initial prompt of a list of hint words, or `None`."""
    words = [word.strip() for word in hints if isinstance(word, str) and word.strip()]
    return ", ".join(words)[:MAX_HINT_CHARACTERS] or None


def checked(encoding, sample_rate, channels):
    try:
        return audio.check_format(encoding, sample_rate, channels)
    except audio.UnsupportedFormat:
        raise refuse_format() from None


def confidence_of(avg_logprob):
    """`exp(avg_logprob)` clamped to 0..1."""
    return round(min(1.0, max(0.0, math.exp(avg_logprob))), 4)


class WhisperEngine:
    """faster-whisper `large-v3`, loaded in the background so `/health` can say `not_ready`."""

    model_name = MODEL

    def __init__(self):
        self.device = os.environ.get("SPEECH_DEVICE", "cuda")
        self.ready = False
        self.model = None

    def load(self):
        from faster_whisper import WhisperModel

        compute = "float16" if self.device == "cuda" else "int8"
        self.model = WhisperModel(os.environ.get("MODEL_PATH", "/models/large-v3"), device=self.device, compute_type=compute)
        self.ready = True

    def transcribe(self, samples, language, prompt, vad):
        """The segments of `samples`: `[{text, start, end, confidence}]`."""
        segments, _ = self.model.transcribe(
            samples,
            language=language,
            initial_prompt=prompt,
            vad_filter=vad,
            vad_parameters={"min_silence_duration_ms": int(SILENCE_SECONDS * 1000)},
            beam_size=5,
            condition_on_previous_text=False,
        )
        return [
            {
                "text": segment.text.strip(),
                "start": round(segment.start, 3),
                "end": round(segment.end, 3),
                "confidence": confidence_of(segment.avg_logprob),
            }
            for segment in segments
            if segment.text.strip()
        ]

    def speech_spans(self, samples):
        """Where the Silero VAD hears speech in `samples`: `[(start, end)]` in seconds."""
        from faster_whisper.vad import VadOptions, get_speech_timestamps

        options = VadOptions(min_silence_duration_ms=int(SILENCE_SECONDS * 1000), speech_pad_ms=0)
        return [(s["start"] / audio.TARGET_RATE, s["end"] / audio.TARGET_RATE) for s in get_speech_timestamps(samples, options)]


def join(segments):
    """`(text, confidence)` of segments: their texts joined and their mean confidence."""
    text = " ".join(segment["text"] for segment in segments)
    confidence = sum(s["confidence"] for s in segments) / len(segments) if segments else None
    return text, confidence


class Stream:
    """One WebSocket stream: audio in, interim and final transcripts out, cut into utterances by the VAD."""

    def __init__(self, engine, tag, language, prompt, fmt):
        self.engine, self.tag, self.language, self.prompt, self.fmt = engine, tag, language, prompt, fmt
        self.buffer = np.zeros(0, dtype=np.float32)
        self.pending = 0.0
        self.total = 0.0

    def transcript(self, final, segments):
        text, confidence = join(segments)
        if not text:
            return []
        event = {"type": "transcript", "text": text, "final": final, "language": self.tag}
        if final and confidence is not None:
            event["confidence"] = round(confidence, 4)
        return [event]

    def feed(self, raw):
        """The events one binary frame produces. Raises `Refused("audio_too_long")` after the closing final."""
        samples = audio.to_mono_16k(raw, *self.fmt)
        seconds = samples.size / audio.TARGET_RATE
        self.total += seconds
        events = []
        if self.total > audio.MAX_SECONDS:
            events += self.flush()
            raise StreamEnded(events, Refused("audio_too_long", 413))
        self.buffer = np.concatenate([self.buffer, samples])
        self.pending += seconds
        if self.pending >= INTERIM_SECONDS:
            self.pending = 0.0
            events += self.analyse()
        return events

    def analyse(self):
        spans = self.engine.speech_spans(self.buffer)
        length = self.buffer.size / audio.TARGET_RATE
        if not spans:
            # Silence only: keep the last second so the next onset is not clipped, and say nothing.
            self.buffer = self.buffer[-audio.TARGET_RATE :]
            return []
        if length - spans[-1][1] >= SILENCE_SECONDS:
            cut = min(self.buffer.size, int((spans[-1][1] + CUT_PADDING_SECONDS) * audio.TARGET_RATE))
            utterance, self.buffer = self.buffer[:cut], self.buffer[cut:]
            return self.transcript(True, self.engine.transcribe(utterance, self.language, self.prompt, False))
        return self.transcript(False, self.engine.transcribe(self.buffer, self.language, self.prompt, False))

    def flush(self):
        """The last final of the open utterance, when it holds speech."""
        buffer, self.buffer = self.buffer, np.zeros(0, dtype=np.float32)
        if buffer.size == 0 or not self.engine.speech_spans(buffer):
            return []
        return self.transcript(True, self.engine.transcribe(buffer, self.language, self.prompt, False))


class StreamEnded(Exception):
    """A stream that must close after sending `events`, with `refusal` when it is an error."""

    def __init__(self, events, refusal):
        super().__init__("stream ended")
        self.events = events
        self.refusal = refusal


class Gate:
    """One job at a time on the GPU; more than `limit` waiting is `busy`."""

    def __init__(self, limit):
        self.limit = limit
        self.waiting = 0
        self.lock = asyncio.Lock()

    async def run(self, work, *args):
        if self.waiting >= self.limit:
            raise Refused("busy", 503)
        self.waiting += 1
        try:
            async with self.lock:
                return await asyncio.get_running_loop().run_in_executor(None, work, *args)
        finally:
            self.waiting -= 1


def error_response(refused):
    return web.json_response({"code": refused.code}, status=refused.status)


async def read_body(request, cap):
    """The request body, or `audio_too_long` once it passes `cap` bytes."""
    if request.content_length is not None and request.content_length > cap:
        raise Refused("audio_too_long", 413)
    body = bytearray()
    async for chunk in request.content.iter_chunked(1 << 16):
        body += chunk
        if len(body) > cap:
            raise Refused("audio_too_long", 413)
    return bytes(body)


def make_app(engine):
    """The application over an `engine` (the stub of a test, or `WhisperEngine`)."""
    gate = Gate(MAX_QUEUE)

    @web.middleware
    async def timing(request, handler):
        started = time.monotonic()
        status = 500
        try:
            response = await handler(request)
            status = response.status
            return response
        except web.HTTPException as error:
            status = error.status
            raise
        finally:
            log.info("%s %s %d %.3fs", request.method, request.path, status, time.monotonic() - started)

    async def health(_request):
        if not engine.ready:
            return error_response(Refused("not_ready", 503))
        return web.json_response({"status": "ok", "model": engine.model_name, "device": engine.device})

    async def transcribe(request):
        try:
            if not engine.ready:
                raise Refused("not_ready", 503)
            headers = request.headers
            try:
                rate, channels = int(headers.get("X-Audio-Sample-Rate", "")), int(headers.get("X-Audio-Channels", ""))
            except ValueError:
                raise refuse_format() from None
            encoding, rate, channels = checked(headers.get("X-Audio-Encoding"), rate, channels)
            tag = headers.get("X-Language", "")
            language = primary_language(tag)
            prompt = prompt_of(unquote(headers.get("X-Hints", "")).split(","))
            cap = int(audio.MAX_SECONDS * rate * audio.WIDTH[encoding] * channels)
            samples = audio.to_mono_16k(await read_body(request, cap), encoding, rate, channels)
            segments = await gate.run(engine.transcribe, samples, language, prompt, True)
            text, _ = join(segments)
            return web.json_response(
                {
                    "segments": segments,
                    "text": text,
                    "language": tag,
                    "durationSeconds": round(samples.size / audio.TARGET_RATE, 3),
                }
            )
        except Refused as refused:
            return error_response(refused)

    async def listen(request):
        socket = web.WebSocketResponse()
        await socket.prepare(request)
        started = time.monotonic()

        async def fail(refused):
            await socket.send_json({"type": "error", "code": refused.code})
            await socket.close()

        try:
            if not engine.ready:
                raise Refused("not_ready", 503)
            first = await socket.receive()
            if first.type != WSMsgType.TEXT:
                raise refuse_format()
            try:
                start = json.loads(first.data)
                if start.get("type") != "start":
                    raise ValueError
                fmt = checked(start.get("encoding"), start.get("sampleRate"), start.get("channels"))
                tag = start.get("language")
                hints = start.get("hints", [])
            except (ValueError, AttributeError):
                raise refuse_format() from None
            language = primary_language(tag)
            stream = Stream(engine, tag, language, prompt_of(hints if isinstance(hints, list) else []), fmt)
            async for message in socket:
                if message.type == WSMsgType.BINARY:
                    try:
                        events = await gate.run(stream.feed, message.data)
                    except StreamEnded as ended:
                        for event in ended.events:
                            await socket.send_json(event)
                        await fail(ended.refusal)
                        return socket
                    for event in events:
                        await socket.send_json(event)
                elif message.type == WSMsgType.TEXT:
                    try:
                        closing = json.loads(message.data).get("type") == "end"
                    except (ValueError, AttributeError):
                        closing = False
                    if not closing:
                        raise refuse_format()
                    for event in await gate.run(stream.flush):
                        await socket.send_json(event)
                    await socket.close(code=1000)
                    break
                else:
                    break  # the client closed: abort, no final flush
        except Refused as refused:
            if not socket.closed:
                await fail(refused)
        finally:
            log.info("WS %s 101 %.3fs", request.path, time.monotonic() - started)
        return socket

    app = web.Application(middlewares=[timing], client_max_size=2**31)
    app.add_routes([web.get("/health", health), web.post("/v1/transcribe", transcribe), web.get("/v1/listen", listen)])
    return app


if __name__ == "__main__":
    import threading

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    engine = WhisperEngine()
    threading.Thread(target=engine.load, daemon=True).start()
    # shortcut: one job at a time on one GPU and no token; scale with replicas (one GPU each), and add a Connection
    # credential if the namespace ever stops being private.
    web.run_app(make_app(engine), host="0.0.0.0", port=PORT, access_log=None)
