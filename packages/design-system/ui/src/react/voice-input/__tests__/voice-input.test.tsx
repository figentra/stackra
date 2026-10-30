/**
 * Stackra file contract:
 * Purpose: proves the web VoiceInput starts and stops a recorder from its toggle (`aria-pressed`, named for the next
 *          press), shows the level while listening, announces each state, waits in "Processing" while `onRecord`
 *          runs, cancels on Escape, and says when the microphone is refused.
 * Boundary: jsdom with real HeroUI; the recorder is the mock driver.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); WCAG 2.2 SC 4.1.2, 4.1.3; STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { createMockVoiceRecorder } from "#core/functions/create-mock-voice-recorder.function";
import { VoiceInput } from "#react/voice-input/voice-input";

/** Lets the recorder's promises settle inside `act`. */
const settle = () => act(async () => {});

describe("VoiceInput (web)", () => {
  it("records, shows the level and hands the recording over", async () => {
    vi.useFakeTimers();
    const pending: { finish?: () => void } = {};
    const onRecord = vi.fn(
      () =>
        new Promise<undefined>((resolve) => {
          pending.finish = () => resolve(undefined);
        }),
    );
    const onStateChange = vi.fn();
    const { container } = render(
      <VoiceInput
        recorder={createMockVoiceRecorder()}
        onRecord={onRecord}
        onStateChange={onStateChange}
      />,
    );
    const button = screen.getByRole("button", { name: "Start recording" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button);
    await settle();
    const stop = screen.getByRole("button", { name: "Stop recording" });
    expect(stop.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("status").textContent).toContain("Listening…");
    act(() => vi.advanceTimersByTime(400));
    expect(container.querySelectorAll("[data-slot=voice-level] > span")).toHaveLength(5);
    fireEvent.click(stop);
    await settle();
    expect(onRecord).toHaveBeenCalledWith(expect.objectContaining({ mimeType: "audio/mock" }));
    expect(screen.getByRole("status").textContent).toBe("Processing…");
    await act(async () => pending.finish?.());
    expect(screen.getByRole("status").textContent).toBe("Press the microphone to speak");
    expect(onStateChange.mock.calls.map(([state]) => state)).toEqual([
      "requesting",
      "listening",
      "processing",
      "idle",
    ]);
    vi.useRealTimers();
  });

  it("cancels on Escape and says so", async () => {
    const onRecord = vi.fn();
    render(<VoiceInput recorder={createMockVoiceRecorder()} onRecord={onRecord} />);
    fireEvent.click(screen.getByRole("button", { name: "Start recording" }));
    await settle();
    fireEvent.keyDown(screen.getByRole("button", { name: "Stop recording" }), { key: "Escape" });
    expect(screen.getByRole("status").textContent).toBe("Recording cancelled");
    expect(onRecord).not.toHaveBeenCalled();
  });

  it("says when the microphone is refused", async () => {
    render(
      <VoiceInput recorder={createMockVoiceRecorder({ deny: true })} label="Dictate a reply" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dictate a reply" }));
    await settle();
    expect(screen.getByRole("status").textContent).toContain("Microphone access is blocked");
  });
});
