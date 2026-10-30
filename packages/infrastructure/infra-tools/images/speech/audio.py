# Stackra file contract:
# Purpose: the audio side of the speech server: checks a stream's format (`linear16`, `mulaw` or `alaw`, 8000 to 48000
#          Hz, one or two channels), decodes G.711 with a 256-entry table, downmixes to mono and resamples to the 16 kHz
#          float32 samples Whisper takes.
# Boundary: pure numpy over bytes; keeps and logs nothing. No `audioop` (removed in Python 3.13).
#           shortcut: resampling is a box filter (when lowering the rate) then linear interpolation, good for speech
#           recognition but not studio audio; swap in a polyphase filter if accuracy at 48 kHz ever suffers.
# Runtime: python 3.12 in the tools-speech image (numpy)
# Governing contract: .agents/specs/sta-1629-ai-everywhere/contracts/tools-speech.md; ADR 0492 (decision 9); ADR 0376.
import numpy as np

TARGET_RATE = 16000
MIN_RATE = 8000
MAX_RATE = 48000
MAX_SECONDS = 300
# Bytes per sample per channel.
WIDTH = {"linear16": 2, "mulaw": 1, "alaw": 1}


class UnsupportedFormat(Exception):
    """The encoding, rate or channel count is outside the contract's table."""


def _mulaw_table():
    table = np.zeros(256, dtype=np.int16)
    for code in range(256):
        value = ~code & 0xFF
        sample = (((value & 0x0F) << 3) + 0x84) << ((value >> 4) & 0x07)
        sample -= 0x84
        table[code] = -sample if value & 0x80 else sample
    return table


def _alaw_table():
    table = np.zeros(256, dtype=np.int16)
    for code in range(256):
        value = code ^ 0x55
        exponent = (value >> 4) & 0x07
        mantissa = value & 0x0F
        sample = (mantissa << 4) + 8 if exponent == 0 else ((mantissa << 4) + 0x108) << (exponent - 1)
        table[code] = sample if value & 0x80 else -sample
    return table


G711 = {"mulaw": _mulaw_table(), "alaw": _alaw_table()}


def check_format(encoding, sample_rate, channels):
    """The `(encoding, sample_rate, channels)` as validated integers, or `UnsupportedFormat`."""
    if encoding not in WIDTH:
        raise UnsupportedFormat("encoding")
    if not isinstance(sample_rate, int) or isinstance(sample_rate, bool) or not MIN_RATE <= sample_rate <= MAX_RATE:
        raise UnsupportedFormat("sampleRate")
    if channels not in (1, 2) or isinstance(channels, bool):
        raise UnsupportedFormat("channels")
    return encoding, sample_rate, channels


def seconds_of(byte_count, encoding, sample_rate, channels):
    """The duration of `byte_count` bytes of audio in that format."""
    return byte_count / (WIDTH[encoding] * channels * sample_rate)


def to_mono_16k(raw, encoding, sample_rate, channels):
    """`raw` as mono float32 samples in -1..1 at 16 kHz; a trailing partial frame is dropped."""
    frame = WIDTH[encoding] * channels
    raw = bytes(raw[: len(raw) - len(raw) % frame])
    if encoding == "linear16":
        samples = np.frombuffer(raw, dtype="<i2").astype(np.float32)
    else:
        samples = G711[encoding][np.frombuffer(raw, dtype=np.uint8)].astype(np.float32)
    samples /= 32768.0
    if channels == 2:
        samples = samples.reshape(-1, 2).mean(axis=1)
    if sample_rate == TARGET_RATE or samples.size == 0:
        return samples
    if sample_rate > TARGET_RATE:
        span = max(1, round(sample_rate / TARGET_RATE))
        samples = np.convolve(samples, np.ones(span, dtype=np.float32) / span, mode="same")
    count = int(samples.size * TARGET_RATE / sample_rate)
    positions = np.arange(count) * (sample_rate / TARGET_RATE)
    return np.interp(positions, np.arange(samples.size), samples).astype(np.float32)
