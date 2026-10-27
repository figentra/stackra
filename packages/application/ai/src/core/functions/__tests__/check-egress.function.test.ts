/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEgress`: a public https host passes; http, a port, credentials, IP literals (dotted,
 *          numeric and IPv6), single labels and private suffixes are refused; deny wins over allow; an allow list
 *          narrows to its exact hosts and wildcard subdomains.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0450 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkEgress } from "#core/functions/check-egress.function";

describe(checkEgress, () => {
  it("lets a public https host through", () => {
    expect(checkEgress("https://shop.example.com/products/a?x=1", {})).toBeUndefined();
    expect(checkEgress("https://Shop.Example.com./", {})).toBeUndefined();
  });

  it.each([
    "http://shop.example.com/",
    "https://shop.example.com:8443/",
    "https://user:pass@shop.example.com/",
    "https://169.254.169.254/latest/meta-data",
    "https://2130706433/",
    "https://[::1]/",
    "https://localhost/",
    "https://intranet/",
    "https://printer.local/",
    "https://db.internal/",
    "https://app.localhost/",
    "https://router.home.arpa/",
    "file:///etc/passwd",
    "not a url",
  ])("refuses %s", (url) => {
    expect(checkEgress(url, {})).toBe("egress_refused");
  });

  it("applies the policy's deny and allow lists", () => {
    const policy = {
      allowHosts: ["shop.example.com", "*.cdn.example.net"],
      denyHosts: ["bad.cdn.example.net"],
    };
    expect(checkEgress("https://shop.example.com/", policy)).toBeUndefined();
    expect(checkEgress("https://img.cdn.example.net/", policy)).toBeUndefined();
    expect(checkEgress("https://cdn.example.net/", policy)).toBe("egress_refused");
    expect(checkEgress("https://bad.cdn.example.net/", policy)).toBe("egress_refused");
    expect(checkEgress("https://other.example.com/", policy)).toBe("egress_refused");
  });
});
