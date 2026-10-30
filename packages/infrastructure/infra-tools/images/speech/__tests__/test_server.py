# Stackra file contract:
# Purpose: tests of the speech server with a stub engine, to the contract in
#          `.agents/specs/sta-1629-ai-everywhere/contracts/tools-speech.md`: `/health` (ok and `not_ready`),
#          `/v1/transcribe` (the response shape, G.711 and stereo input, hints, and every error code:
#          `unsupported_format`, `unsupported_language`, `audio_too_long`, `not_ready`, `busy`), and `/v1/listen`
#          (interim then final transcripts cut on silence, the final on `end`, an abort with no flush, and the error
#          frames). The G.711 tables and the resampler are checked on known values. No model is loaded.
# Boundary: test only; run with `python -m pytest images/speech/__tests__` in the image's build context (CI) with
#           aiohttp, numpy and pytest installed.
# Runtime: python 3.12 (pytest, aiohttp, numpy)
# Governing contract: ADR 0022 (test placement); ADR 0492 (decision 9); ADR 0376 (decision 7).
import asyncio
import sys
from pathlib import Path
from urllib.parse import quote

import numpy as np
from aiohttp.test_utils import TestClient, TestServer

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import audio  # noqa: E402
import server  # noqa: E402

RATE = 16000


class StubEngine:
    """Speech is wherever the samples are non-zero; the text counts the samples."""

    model_name = "large-v3"
    device = "cuda"

    def __init__(self, ready=True):
        self.ready = ready
        self.calls = []

    def transcribe(self, samples, language, prompt, vad):
        self.calls.append({"language": language, "prompt": prompt, "vad": vad})
        if not np.any(samples):
            return []
        return [{"text": f"heard {samples.size}", "start": 0.0, "end": samples.size / RATE, "confidence": 0.9}]

    def speech_spans(self, samples):
        loud = np.flatnonzero(samples)
        return [(loud[0] / RATE, (loud[-1] + 1) / RATE)] if loud.size else []


def pcm(seconds, loud=True, rate=RATE):
    samples = np.full(round(seconds * rate), 1000 if loud else 0, dtype="<i2")
    return samples.tobytes()


def run(engine, scenario):
    async def go():
        async with TestClient(TestServer(server.make_app(engine))) as client:
            return await scenario(client)

    return asyncio.run(go())


def headers(**override):
    base = {
        "Content-Type": "application/octet-stream",
        "X-Audio-Encoding": "linear16",
        "X-Audio-Sample-Rate": "16000",
        "X-Audio-Channels": "1",
        "X-Language": "ar-AE",
    }
    return {**base, **override}


async def post(client, body, **override):
    response = await client.post("/v1/transcribe", data=body, headers=headers(**override))
    return response.status, await response.json()


def test_health_reports_the_model_and_not_ready():
    async def scenario(client):
        response = await client.get("/health")
        return response.status, await response.json()

    assert run(StubEngine(), scenario) == (200, {"status": "ok", "model": "large-v3", "device": "cuda"})
    assert run(StubEngine(ready=False), scenario) == (503, {"code": "not_ready"})


def test_transcribe_returns_segments_and_echoes_the_full_language_tag():
    engine = StubEngine()
    status, body = run(
        engine, lambda client: post(client, pcm(2), **{"X-Hints": quote("حليب,خبز")})
    )
    assert status == 200
    assert body["language"] == "ar-AE"
    assert body["durationSeconds"] == 2.0
    assert body["segments"] == [{"text": "heard 32000", "start": 0.0, "end": 2.0, "confidence": 0.9}]
    assert body["text"] == "heard 32000"
    assert engine.calls == [{"language": "ar", "prompt": "حليب, خبز", "vad": True}]


def test_transcribe_takes_g711_stereo_and_other_rates():
    ulaw = bytes([0x00]) * 8000  # 0x00 is the most negative mu-law value: loud
    alaw = bytes([0x2A]) * 8000
    stereo = np.full(16000, 1000, dtype="<i2").tobytes()  # 8000 frames of two channels

    async def scenario(client):
        return [
            await post(client, ulaw, **{"X-Audio-Encoding": "mulaw", "X-Audio-Sample-Rate": "8000"}),
            await post(client, alaw, **{"X-Audio-Encoding": "alaw", "X-Audio-Sample-Rate": "8000"}),
            await post(client, stereo, **{"X-Audio-Channels": "2", "X-Audio-Sample-Rate": "8000"}),
            await post(client, pcm(1, rate=48000), **{"X-Audio-Sample-Rate": "48000"}),
        ]

    for status, body in run(StubEngine(), scenario):
        assert status == 200
        assert body["durationSeconds"] == 1.0


def test_transcribe_refuses_with_the_contracts_codes():
    async def scenario(client):
        return {
            "encoding": await post(client, pcm(1), **{"X-Audio-Encoding": "opus"}),
            "rate": await post(client, pcm(1), **{"X-Audio-Sample-Rate": "4000"}),
            "rate_text": await post(client, pcm(1), **{"X-Audio-Sample-Rate": "fast"}),
            "channels": await post(client, pcm(1), **{"X-Audio-Channels": "6"}),
            "language": await post(client, pcm(1), **{"X-Language": "xx-YY"}),
            "no_language": await post(client, pcm(1), **{"X-Language": ""}),
            "too_long": await post(client, pcm(301)),
        }

    results = run(StubEngine(), scenario)
    for key in ("encoding", "rate", "rate_text", "channels"):
        assert results[key] == (400, {"code": "unsupported_format"}), key
    assert results["language"] == (400, {"code": "unsupported_language"})
    assert results["no_language"] == (400, {"code": "unsupported_language"})
    assert results["too_long"] == (413, {"code": "audio_too_long"})
    assert run(StubEngine(ready=False), lambda client: post(client, pcm(1))) == (503, {"code": "not_ready"})


def test_transcribe_is_busy_when_the_queue_is_full(monkeypatch):
    monkeypatch.setattr(server, "MAX_QUEUE", 0)
    assert run(StubEngine(), lambda client: post(client, pcm(1))) == (503, {"code": "busy"})


START = {"type": "start", "language": "ar-AE", "encoding": "linear16", "sampleRate": 16000, "channels": 1, "hints": ["x"]}


def test_listen_sends_interim_then_a_final_cut_on_silence_then_the_last_final_on_end():
    async def scenario(client):
        socket = await client.ws_connect("/v1/listen")
        await socket.send_json(START)
        await socket.send_bytes(pcm(0.6))  # speech: an interim
        first = await socket.receive_json()
        await socket.send_bytes(pcm(0.7, loud=False))  # 0.7 s of silence after speech: the utterance is cut
        second = await socket.receive_json()
        await socket.send_bytes(pcm(0.6))  # a second utterance
        third = await socket.receive_json()
        await socket.send_json({"type": "end"})
        fourth = await socket.receive_json()
        closed = await socket.receive()
        return first, second, third, fourth, closed.type, socket.close_code

    first, second, third, fourth, closed_type, code = run(StubEngine(), scenario)
    assert first == {"type": "transcript", "text": "heard 9600", "final": False, "language": "ar-AE"}
    assert second["final"] is True and second["confidence"] == 0.9 and second["language"] == "ar-AE"
    assert third["final"] is False
    assert fourth["final"] is True
    assert code == 1000


def test_listen_says_nothing_for_silence_and_does_not_flush_on_abort():
    async def scenario(client):
        socket = await client.ws_connect("/v1/listen")
        await socket.send_json(START)
        await socket.send_bytes(pcm(1, loud=False))
        await socket.send_json({"type": "end"})
        return (await socket.receive()).type

    from aiohttp import WSMsgType

    assert run(StubEngine(), scenario) == WSMsgType.CLOSE

    async def abort(client):
        socket = await client.ws_connect("/v1/listen")
        await socket.send_json(START)
        await socket.send_bytes(pcm(0.3))
        await socket.close()

    engine = StubEngine()
    run(engine, abort)
    assert engine.calls == []


def test_listen_closes_with_audio_too_long_after_a_final():
    async def scenario(client):
        socket = await client.ws_connect("/v1/listen")
        await socket.send_json(START)
        events = []
        for _ in range(31):
            await socket.send_bytes(pcm(10))
            if socket.closed:
                break
        async for message in socket:
            events.append(message.json())
        return events

    events = run(StubEngine(), scenario)
    assert events[-1] == {"type": "error", "code": "audio_too_long"}
    assert any(event.get("final") is True for event in events[:-1])


def test_listen_error_frames():
    async def refused(client, start, body=None):
        socket = await client.ws_connect("/v1/listen")
        if body is None:
            await socket.send_json(start)
        else:
            await socket.send_str(body)
        return await socket.receive_json()

    async def scenario(client):
        return {
            "format": await refused(client, {**START, "encoding": "opus"}),
            "rate": await refused(client, {**START, "sampleRate": 100}),
            "channels": await refused(client, {**START, "channels": 3}),
            "language": await refused(client, {**START, "language": "xx"}),
            "malformed": await refused(client, None, "not json"),
            "not_start": await refused(client, {"type": "end"}),
        }

    results = run(StubEngine(), scenario)
    for key in ("format", "rate", "channels", "malformed", "not_start"):
        assert results[key] == {"type": "error", "code": "unsupported_format"}, key
    assert results["language"] == {"type": "error", "code": "unsupported_language"}

    async def not_ready(client):
        return await refused(client, START)

    assert run(StubEngine(ready=False), not_ready) == {"type": "error", "code": "not_ready"}


def test_g711_tables_and_resampling():
    assert audio.G711["mulaw"][0xFF] == 0 and audio.G711["mulaw"][0x00] == -32124
    assert audio.G711["mulaw"][0x80] == 32124
    assert audio.G711["alaw"][0xD5] == 8 and audio.G711["alaw"][0x55] == -8
    one_second = np.zeros(48000, dtype="<i2").tobytes()
    assert audio.to_mono_16k(one_second, "linear16", 48000, 1).size == 16000
    assert audio.to_mono_16k(b"\x00\x00\x00", "linear16", 16000, 1).size == 1  # a partial frame is dropped
