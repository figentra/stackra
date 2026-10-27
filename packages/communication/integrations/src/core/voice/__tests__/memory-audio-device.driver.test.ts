/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAudioDeviceDriver`: capture replays the given chunks and stops on abort; play keeps
 *          what was played.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0376 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { AudioDevice } from "#contracts/voice/audio-device.port";
import { AudioEncoding } from "#contracts/voice/audio-encoding.enum";
import { MemoryAudioDeviceDriver } from "#core/voice/memory-audio-device.driver";

const FORMAT = { encoding: AudioEncoding.Linear16, sampleRate: 16_000, channels: 1 };

describe("MemoryAudioDeviceDriver", () => {
  it("replays its chunks and keeps what it plays", async () => {
    const chunks = [new Uint8Array([1, 2]), new Uint8Array([3])];
    const device = MemoryAudioDeviceDriver.with(chunks);
    expect(device).toBeInstanceOf(AudioDevice);
    const heard: Uint8Array[] = [];
    for await (const chunk of device.capture(FORMAT)) heard.push(chunk);
    expect(heard).toEqual(chunks);
    await device.play(device.capture(FORMAT), FORMAT);
    expect(device.played).toEqual(chunks);
  });

  it("stops capturing once aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const heard: Uint8Array[] = [];
    for await (const chunk of MemoryAudioDeviceDriver.with([new Uint8Array([1])]).capture(
      FORMAT,
      controller.signal,
    ))
      heard.push(chunk);
    expect(heard).toEqual([]);
  });
});
