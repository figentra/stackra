/**
 * Stackra file contract:
 * Purpose: unit tests of `networkCheck`: a host with no answering address fails the row, an address dropped while a
 *          sibling answers warns, all answering is ok, and every fix gives steps for any network (connection, proxy,
 *          VPN, firewall) without naming one vendor's product.
 * Boundary: test only; the probes are literals, so no host is contacted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1952 spec FR-016; STA-2859.
 */
import { describe, expect, it } from "@stackra/testing";

import { networkCheck } from "#node/doctor/functions/network-check.function";
import type { HostProbe } from "#node/doctor/types/host-probe.type";

const VENDOR = /warp|cloudflare|one\.one\.one\.one|1\.1\.1\.1/i;

describe("networkCheck", () => {
  it("is ok when every host answers", () => {
    const result = networkCheck(
      ["github.com"],
      [{ host: "github.com", address: "140.82.121.3", ok: true }],
    );
    expect(result).toMatchObject({ name: "network", status: "ok", detail: undefined });
  });

  it("fails a host that answers on no address, with generic steps", () => {
    const probes: HostProbe[] = [
      { host: "github.com", address: "140.82.121.3", ok: true },
      { host: "registry.npmjs.org", address: "", ok: false },
    ];
    const result = networkCheck(["github.com", "registry.npmjs.org"], probes);
    expect(result.status).toBe("fail");
    expect(result.detail).toBe("unreachable: registry.npmjs.org");
    expect(result.fix).toMatch(/proxy, VPN or firewall/);
    expect(result.fix).not.toMatch(VENDOR);
  });

  it("warns on an address dropped while a sibling answers, with generic steps", () => {
    const probes: HostProbe[] = [
      { host: "github.com", address: "140.82.121.3", ok: true },
      { host: "github.com", address: "140.82.121.4", ok: false },
    ];
    const result = networkCheck(["github.com"], probes);
    expect(result.status).toBe("warn");
    expect(result.detail).toBe("dropped while sibling addresses answer: github.com 140.82.121.4");
    expect(result.fix).toMatch(/address ranges/);
    expect(result.fix).not.toMatch(VENDOR);
  });
});
