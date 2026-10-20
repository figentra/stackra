/**
 * Stackra file contract:
 * Purpose: proves every window keeps the renderer sandboxed with no Node access.
 * Owner: the app owner · Secrets: forbidden
 */
import { windowOptions } from "../window-options";

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
