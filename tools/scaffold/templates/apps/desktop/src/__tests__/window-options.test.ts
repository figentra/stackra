/**
 * Stackra file contract:
 * Purpose: proves every window keeps the renderer sandboxed with no Node access.
 * Boundary: builds options objects only.
 * Runtime: node
 * Governing contract: ADR 0251 (Electron hardening); ADR 0022 (test placement).
 */
import { windowOptions } from "#src/window-options";

describe("windowOptions", () => {
  it("locks the renderer down", () => {
    expect(windowOptions().webPreferences).toEqual({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    });
  });

  it("takes a size", () => {
    expect(windowOptions(800, 600)).toMatchObject({ width: 800, height: 600 });
  });
});
