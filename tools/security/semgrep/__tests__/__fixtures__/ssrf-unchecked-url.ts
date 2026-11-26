/**
 * Stackra file contract:
 * Purpose: Semgrep test fixture for `stackra.ssrf-unchecked-url` (`ruleid:` lines must match, `ok:` lines must not).
 * Boundary: never imported or run; `semgrep --test` reads it (`pnpm security:sast --test`).
 * Runtime: none
 * Governing contract: tools/security/semgrep/rules/ssrf-unchecked-url.yml; ADR 0450 decision 3; STA-2821.
 */
declare function checkEgress(url: string, policy: object): string | undefined;
declare const policy: object;
declare const http: { get(url: string): Promise<Response> };

export class FetchPreviewAction {
  async handle(input: { url: string }): Promise<number> {
    // ruleid: stackra.ssrf-unchecked-url
    const response = await fetch(input.url);
    return response.status;
  }
}

export class CheckedPreviewAction {
  async handle(input: { url: string }): Promise<number> {
    if (checkEgress(input.url, policy) !== undefined) throw new Error("egress_refused");
    // ok: stackra.ssrf-unchecked-url
    const response = await fetch(input.url);
    return response.status;
  }
}

export class FixedHostAction {
  async handle(input: { id: string }): Promise<number> {
    // ok: stackra.ssrf-unchecked-url
    const response = await fetch("https://api.example.com/items");
    return response.status + input.id.length;
  }
}

export async function webhookProbe(req: { body: { target: string } }): Promise<void> {
  // ruleid: stackra.ssrf-unchecked-url
  await http.get(req.body.target);
}
