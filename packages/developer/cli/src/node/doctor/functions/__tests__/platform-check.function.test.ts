/**
 * Stackra file contract:
 * Purpose: unit tests of `platformCheck`: macOS, Linux and WSL 2 pass; native Windows, WSL 1 and any other system
 *          warn (never fail) with a fix that names WSL 2.
 * Boundary: test only; pure, every input injected.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2899 (supported systems).
 */
import { describe, expect, it } from "@stackra/testing";

import { platformCheck } from "#node/doctor/functions/platform-check.function";

describe("platformCheck", () => {
  it("passes macOS and Linux", () => {
    expect(platformCheck("darwin", "25.3.0", {})).toEqual({
      name: "supported system",
      status: "ok",
      detail: "macOS",
    });
    expect(platformCheck("linux", "6.8.0-1017-aws", {})).toMatchObject({
      status: "ok",
      detail: "Linux",
    });
  });

  it("passes WSL 2, found by its kernel release", () => {
    expect(
      platformCheck("linux", "5.15.167.4-microsoft-standard-WSL2", { WSL_DISTRO_NAME: "Ubuntu" }),
    ).toMatchObject({ status: "ok", detail: "Linux (WSL 2)" });
  });

  it("warns on native Windows and says to use WSL 2", () => {
    const result = platformCheck("win32", "10.0.26100", {});
    expect(result.status).toBe("warn");
    expect(result.detail).toContain("native Windows is not supported");
    expect(result.fix).toContain("wsl --install");
    expect(result.fix).toContain("https://docs.stackra.figentra.com/quickstart");
  });

  it("warns on WSL 1 and names the distribution to convert", () => {
    const result = platformCheck("linux", "4.4.0-19041-Microsoft", { WSL_DISTRO_NAME: "Ubuntu" });
    expect(result.status).toBe("warn");
    expect(result.detail).toContain("WSL 1");
    expect(result.fix).toContain("wsl --set-version Ubuntu 2");
  });

  it("warns on any other system", () => {
    expect(platformCheck("freebsd", "14.1-RELEASE", {})).toMatchObject({
      status: "warn",
      detail: expect.stringContaining("freebsd is not supported"),
    });
  });
});
