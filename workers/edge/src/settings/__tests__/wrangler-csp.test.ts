/**
 * Stackra file contract:
 * Purpose: guards each environment's `EDGE_CSP` in wrangler.jsonc: every environment's vars parse through
 *          `readSettings`; Pay's checkout keeps `/c/*` per request in each, lets only that environment's Pay console
 *          frame `/preview` (dev, staging, production), and answers `/preview` per request in preview, where a PR's console
 *          host cannot be listed. A wildcard framer is refused.
 * Boundary: test only; reads wrangler.jsonc from disk, no Worker runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437; ADR 0334 rule 12; STA-2562
 */
import { readFileSync } from "node:fs";

import type { EdgeEnv } from "#src/interfaces/edge-env.interface";
import { readSettings } from "#src/settings/read-settings";

/** A string, or a `//` or `/* *\/` comment; the strings are kept. */
const JSONC_TOKEN = /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

/** wrangler.jsonc as JSON: comments and trailing commas dropped. */
const WRANGLER: {
  env: Record<string, { vars: Record<`EDGE_${string}`, string | number> }>;
} = JSON.parse(
  readFileSync(new URL("../../../wrangler.jsonc", import.meta.url), "utf8")
    .replaceAll(JSONC_TOKEN, (_match, text: string | undefined) => text ?? "")
    .replaceAll(/,(\s*[}\]])/g, "$1"),
);

/** What the owner sets before a first deploy (the secret, the ZITADEL issuer and audience), as a test stands in. */
const OWNER = {
  EDGE_SIGNING_SECRET: "secret",
  EDGE_OIDC_ISSUER: "https://id.example",
  EDGE_OIDC_AUDIENCE: "project-1",
};

/** The settings of environment `name`: its vars from wrangler.jsonc, with the owner's values. */
const settingsOf = (name: string) => {
  const vars = WRANGLER.env[name]?.vars;
  if (vars === undefined) throw new Error(`wrangler.jsonc has no env.${name}`);
  const env: EdgeEnv = { ...vars, ...OWNER };
  return readSettings(env);
};

/** Each runway environment's Pay console. */
const CONSOLES = {
  dev: "https://console.pay.dev.figentra.com",
  staging: "https://console.pay.staging.figentra.com",
  production: "https://console.pay.figentra.com",
} as const;

describe("wrangler.jsonc EDGE_CSP", () => {
  /** Runway's four environments, each with Pay's checkout framed by its own console only. */
  it("lets each environment's Pay console frame the checkout preview", () => {
    for (const [name, console] of Object.entries(CONSOLES))
      expect(settingsOf(name).csp["pay.checkout"]?.frameAncestors).toEqual({
        "/c/*": "request",
        "/preview": [console],
      });
  });

  /** A PR's console host changes with the PR, and no wildcard is allowed: Pay answers per request. */
  it("answers the preview per request in preview", () => {
    expect(settingsOf("preview").csp["pay.checkout"]?.frameAncestors).toEqual({
      "/c/*": "request",
      "/preview": "request",
    });
  });

  /** The providers' embedded widgets (pay#151): HyperPay's sandbox outside production, its live host in production only. */
  it("loads the payment widgets, HyperPay's live host in production only", () => {
    const geidea = [
      "https://www.ksamerchant.geidea.net",
      "https://www.merchant.geidea.net",
      "https://payments.geidea.ae",
    ];
    for (const name of ["dev", "preview", "staging", "production"]) {
      const hyperpay =
        name === "production" ? "https://eu-prod.oppwa.com" : "https://eu-test.oppwa.com";
      const checkout = settingsOf(name).csp["pay.checkout"];
      const origins = [hyperpay, ...geidea];
      expect(Object.keys(checkout?.thirdPartyScripts ?? {})).toEqual(origins);
      expect(Object.values(checkout?.thirdPartyScripts ?? {})).toEqual(
        origins.map(() => "necessary"),
      );
      expect(checkout?.extraFrameSrc).toEqual(origins);
      expect(checkout?.extraConnectSrc).toEqual(origins);
    }
    expect(JSON.stringify(settingsOf("production").csp)).not.toContain("eu-test.oppwa.com");
  });

  /** A payment page is never framed by any site: a wildcard framer does not load. */
  it("refuses a wildcard framer", () => {
    const vars = WRANGLER.env["preview"]?.vars ?? {};
    const env: EdgeEnv = {
      ...vars,
      ...OWNER,
      EDGE_CSP: JSON.stringify({
        "pay.checkout": {
          frameAncestors: { "/preview": ["https://*.pay.preview.figentra.com"] },
        },
      }),
    };
    expect(() => readSettings(env)).toThrow(RangeError);
  });
});
