/**
 * Stackra file contract:
 * Purpose: proves the haptics switch starts on, tells its listeners once per change and stops after unsubscribing,
 *          that a wrapped handler still runs and a missing one stays missing, and that playing never throws where
 *          `expo-haptics` cannot load (as in this test).
 * Boundary: the module's state only; no native engine runs. Each test imports a fresh copy of the module.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
beforeEach(() => {
  vi.resetModules();
});

describe("haptics", () => {
  it("is on by default and tells listeners once per change", async () => {
    const { haptics } = await import("#native/haptics/haptics");
    const listener = vi.fn();
    const unsubscribe = haptics.subscribe(listener);
    expect(haptics.isEnabled()).toBe(true);
    haptics.setEnabled(true);
    expect(listener).not.toHaveBeenCalled();
    haptics.setEnabled(false);
    expect(haptics.isEnabled()).toBe(false);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    haptics.setEnabled(true);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("plays without throwing where the engine is missing, and wraps only a given handler", async () => {
    const { haptics } = await import("#native/haptics/haptics");
    const { withHaptic } = await import("#native/haptics/with-haptic.function");
    expect(() => haptics.play("impact")).not.toThrow();
    const onPress = vi.fn();
    withHaptic("impact", onPress)?.("event");
    expect(onPress).toHaveBeenCalledWith("event");
    expect(withHaptic("impact", undefined)).toBeUndefined();
  });
});
